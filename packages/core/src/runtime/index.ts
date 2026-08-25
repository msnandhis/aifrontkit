import { assertEvent, type AIFrontEvent } from "../events/index.js";
import type { Approval, Artifact, Message, ToolCall } from "../model/index.js";

export interface RuntimeState {
  threadId: string;
  messageOrder: string[];
  messages: Readonly<Record<string, Message>>;
  tools: Readonly<Record<string, ToolCall>>;
  approvals: Readonly<Record<string, Approval>>;
  artifacts: Readonly<Record<string, Artifact>>;
  processedEventIds: ReadonlySet<string>;
}

export function createInitialState(threadId: string): RuntimeState {
  return { threadId, messageOrder: [], messages: {}, tools: {}, approvals: {}, artifacts: {}, processedEventIds: new Set() };
}

export function reduceEvent(state: RuntimeState, event: AIFrontEvent): RuntimeState {
  assertEvent(event);
  if (event.threadId !== state.threadId) throw new Error(`Event thread ${event.threadId} does not match runtime thread ${state.threadId}.`);
  if (state.processedEventIds.has(event.id)) return state;
  const processedEventIds = new Set(state.processedEventIds).add(event.id);

  switch (event.type) {
    case "message.started": {
      const existing = state.messages[event.messageId];
      const message: Message = existing ?? {
        id: event.messageId, threadId: event.threadId, role: event.role, status: "streaming", parts: [{ type: "text", text: "" }], createdAt: event.timestamp
      };
      return { ...state, processedEventIds, messages: { ...state.messages, [event.messageId]: message }, messageOrder: existing ? state.messageOrder : [...state.messageOrder, event.messageId] };
    }
    case "message.delta": {
      const message = state.messages[event.messageId];
      if (!message) throw new Error(`Cannot apply delta before message.started for ${event.messageId}.`);
      const first = message.parts[0];
      if (!first || first.type !== "text") throw new Error("Text deltas require a leading text content part.");
      return { ...state, processedEventIds, messages: { ...state.messages, [event.messageId]: { ...message, parts: [{ ...first, text: first.text + event.delta }, ...message.parts.slice(1)] } } };
    }
    case "message.completed":
    case "message.failed": {
      const message = state.messages[event.messageId];
      if (!message) throw new Error(`Cannot finish unknown message ${event.messageId}.`);
      return {
        ...state,
        processedEventIds,
        messages: {
          ...state.messages,
          [event.messageId]: {
            ...message,
            status: event.type === "message.completed" ? "complete" : "failed",
            completedAt: event.timestamp,
            ...(event.type === "message.failed" ? { error: event.error } : {})
          }
        }
      };
    }
    case "tool.updated": {
      const previous = state.tools[event.toolCallId];
      const tool: ToolCall = { ...(previous ?? {}), id: event.toolCallId, name: event.name, status: event.status, ...(event.messageId === undefined ? {} : { messageId: event.messageId }), ...(event.input === undefined ? {} : { input: event.input }), ...(event.output === undefined ? {} : { output: event.output }), ...(event.error === undefined ? {} : { error: event.error }) };
      return { ...state, processedEventIds, tools: { ...state.tools, [event.toolCallId]: tool } };
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
