import { assertEvent, type AIFrontEvent, type AIFrontEventV2 } from "../events/index.js";
import { migrateEventToV2 } from "../migrations/index.js";
import type { Approval, Artifact, ContentPart, ConversationStatus, Message, ToolCall, ToolContentPart } from "../model/index.js";

export interface RuntimeState {
  threadId: string;
  messageOrder: readonly string[];
  messages: Readonly<Record<string, Message>>;
  tools: Readonly<Record<string, ToolCall>>;
  approvals: Readonly<Record<string, Approval>>;
  artifacts: Readonly<Record<string, Artifact>>;
  processedEventIds: ReadonlySet<string>;
}

export function createInitialState(threadId: string): RuntimeState {
  return { threadId, messageOrder: [], messages: {}, tools: {}, approvals: {}, artifacts: {}, processedEventIds: new Set() };
}

export function createStateFromMessages(threadId: string, messages: readonly Message[]): RuntimeState {
  const normalized = messages.map((message) => message.threadId === threadId ? message : { ...message, threadId });
  return {
    ...createInitialState(threadId),
    messageOrder: normalized.map((message) => message.id),
    messages: Object.fromEntries(normalized.map((message) => [message.id, message]))
  };
}

/** Derive transcript state without conflating it with individual message status. */
export function getConversationStatus(state: Pick<RuntimeState, "messageOrder" | "messages"> & { tools?: Readonly<Record<string, ToolCall>> }): ConversationStatus {
  if (state.messageOrder.length === 0) return "idle";
  const messages = state.messageOrder.map((id) => state.messages[id]).filter((message): message is Message => Boolean(message));
  if (Object.values(state.tools ?? {}).some((tool) => tool.status === "approval-requested")) return "awaiting-approval";
  if (messages.some((message) => message.status === "streaming")) return "streaming";
  if (messages.some((message) => message.status === "pending")) return "submitted";
  const latest = messages.at(-1);
  if (latest?.status === "interrupted") return "interrupted";
  if (latest?.status === "failed") return "failed";
  return "completed";
}

function requireMessage(state: RuntimeState, messageId: string) {
  const message = state.messages[messageId];
  if (!message) throw new Error(`Cannot update unknown message ${messageId}.`);
  return message;
}

function partIndex(parts: readonly ContentPart[], partId: string) {
  const explicit = parts.findIndex((part) => part.id === partId);
  if (explicit >= 0) return explicit;
  // v1 had an implicit first text part. This fallback is deliberately narrow.
  return partId === "text:0" && parts[0]?.type === "text" ? 0 : -1;
}

function updateMessage(state: RuntimeState, message: Message, processedEventIds: Set<string>): RuntimeState {
  return { ...state, processedEventIds, messages: { ...state.messages, [message.id]: message } };
}

function appendPart(message: Message, partId: string, part: ContentPart): Message {
  if (partIndex(message.parts, partId) >= 0) throw new Error(`Message ${message.id} already contains part ${partId}.`);
  return { ...message, parts: [...message.parts, { ...part, id: part.id ?? partId }] };
}

function mergeToolPart(message: Message, event: Extract<AIFrontEventV2, { type: "tool.updated" }>): Message {
  if (!event.partId) return message;
  const index = partIndex(message.parts, event.partId);
  const part: ToolContentPart = {
    id: event.partId,
    type: "tool",
    toolCallId: event.toolCallId,
    name: event.name,
    toolStatus: event.status,
    ...(event.input === undefined ? {} : { input: event.input }),
    ...(event.output === undefined ? {} : { output: event.output }),
    ...(event.error === undefined ? {} : { error: event.error })
  };
  if (index < 0) return { ...message, parts: [...message.parts, part] };
  const existing = message.parts[index];
  if (existing?.type !== "tool") throw new Error(`Part ${event.partId} is not a tool part.`);
  const parts = [...message.parts];
  parts[index] = { ...existing, ...part };
  return { ...message, parts };
}

/**
 * Deterministic reducer. v1 events are migrated at the boundary, so all state
 * transitions below use one part-addressed event model.
 */
export function reduceEvent(state: RuntimeState, input: AIFrontEvent): RuntimeState {
  assertEvent(input);
  if (input.threadId !== state.threadId) throw new Error(`Event thread ${input.threadId} does not match runtime thread ${state.threadId}.`);
  if (state.processedEventIds.has(input.id)) return state;
  const event = migrateEventToV2(input);
  const processedEventIds = new Set(state.processedEventIds).add(event.id);

  switch (event.type) {
    case "message.started": {
      const existing = state.messages[event.messageId];
      const message: Message = existing ?? {
        id: event.messageId,
        threadId: event.threadId,
        role: event.role,
        status: "streaming",
        parts: event.parts ? [...event.parts] : [],
        createdAt: event.timestamp
      };
      return {
        ...state,
        processedEventIds,
        messages: { ...state.messages, [event.messageId]: message },
        messageOrder: existing ? state.messageOrder : [...state.messageOrder, event.messageId]
      };
    }
    case "message.part.added": {
      const message = requireMessage(state, event.messageId);
      return updateMessage(state, appendPart(message, event.partId, event.part), processedEventIds);
    }
    case "message.part.delta": {
      const message = requireMessage(state, event.messageId);
      const index = partIndex(message.parts, event.partId);
      // Compatibility: a v1 text delta created its first text part lazily.
      if (index < 0 && event.partId === "text:0") {
        return updateMessage(state, { ...message, parts: [...message.parts, { type: "text", text: event.delta }] }, processedEventIds);
      }
      if (index < 0) throw new Error(`Cannot apply delta to unknown part ${event.partId}.`);
      const current = message.parts[index];
      if (current?.type !== "text" && current?.type !== "reasoning") throw new Error(`Text deltas require a text or reasoning part, received ${current?.type ?? "unknown"}.`);
      const parts = [...message.parts];
      parts[index] = { ...current, text: current.text + event.delta, partStatus: "streaming" };
      return updateMessage(state, { ...message, parts }, processedEventIds);
    }
    case "message.part.updated": {
      const message = requireMessage(state, event.messageId);
      const index = partIndex(message.parts, event.partId);
      if (index < 0) throw new Error(`Cannot update unknown part ${event.partId}.`);
      const parts = [...message.parts];
      parts[index] = { ...event.part, id: event.part.id ?? event.partId };
      return updateMessage(state, { ...message, parts }, processedEventIds);
    }
    case "message.part.status": {
      const message = requireMessage(state, event.messageId);
      const index = partIndex(message.parts, event.partId);
      if (index < 0) throw new Error(`Cannot update status for unknown part ${event.partId}.`);
      const parts = [...message.parts];
      parts[index] = { ...parts[index]!, partStatus: event.status, ...(event.error === undefined ? {} : { error: event.error }) };
      return updateMessage(state, { ...message, parts }, processedEventIds);
    }
    case "message.completed":
    case "message.interrupted":
    case "message.failed": {
      const message = requireMessage(state, event.messageId);
      return updateMessage(state, {
        ...message,
        status: event.type === "message.completed" ? "complete" : event.type === "message.interrupted" ? "interrupted" : "failed",
        completedAt: event.timestamp,
        ...(event.type === "message.failed" ? { error: event.error } : {}),
        ...(event.type === "message.interrupted" && event.reason ? { interruptionReason: event.reason } : {})
      }, processedEventIds);
    }
    case "tool.updated": {
      const previous = state.tools[event.toolCallId];
      const tool: ToolCall = {
        ...(previous ?? {}), id: event.toolCallId, name: event.name, status: event.status,
        ...(event.messageId === undefined ? {} : { messageId: event.messageId }),
        ...(event.partId === undefined ? {} : { partId: event.partId }),
        ...(event.input === undefined ? {} : { input: event.input }),
        ...(event.output === undefined ? {} : { output: event.output }),
        ...(event.error === undefined ? {} : { error: event.error })
      };
      const tools = { ...state.tools, [event.toolCallId]: tool };
      if (!event.messageId) return { ...state, processedEventIds, tools };
      const message = requireMessage(state, event.messageId);
      const updatedMessage = mergeToolPart(message, event);
      return { ...state, processedEventIds, tools, messages: { ...state.messages, [event.messageId]: updatedMessage } };
    }
    case "approval.requested":
      return { ...state, processedEventIds, approvals: { ...state.approvals, [event.approvalId]: { id: event.approvalId, toolCallId: event.toolCallId, summary: event.summary, status: "requested" } } };
    case "approval.resolved": {
      const approval = state.approvals[event.approvalId];
      if (!approval) throw new Error(`Cannot resolve unknown approval ${event.approvalId}.`);
      return { ...state, processedEventIds, approvals: { ...state.approvals, [event.approvalId]: { ...approval, status: event.resolution } } };
    }
    case "artifact.updated":
      return { ...state, processedEventIds, artifacts: { ...state.artifacts, [event.artifact.id]: event.artifact } };
  }
}

export interface Runtime {
  getState(): RuntimeState;
  dispatch(event: AIFrontEvent): void;
  subscribe(listener: () => void): () => void;
}

export function createRuntime(threadId: string, initialEvents: readonly AIFrontEvent[] = []): Runtime {
  let state = initialEvents.reduce(reduceEvent, createInitialState(threadId));
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(event) {
      const next = reduceEvent(state, event);
      if (next !== state) {
        state = next;
        for (const listener of listeners) listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}

/** @deprecated Controlled React primitives accept `messages` directly; use a runtime only for event-driven state. */
export function createRuntimeFromMessages(threadId: string, messages: readonly Message[]): Runtime {
  let state = createStateFromMessages(threadId, messages);
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    dispatch(event) {
      const next = reduceEvent(state, event);
      if (next !== state) {
        state = next;
        for (const listener of listeners) listener();
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
