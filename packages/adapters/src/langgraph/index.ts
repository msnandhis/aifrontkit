import type { AgentCheckpoint, AgentCheckpointKind, AIFrontEvent } from "@aifrontkit/core";

export interface LangGraphMessageChunk {
  id?: string;
  content?: unknown;
  text?: string;
}

export interface LangGraphMessageMetadata {
  langgraph_node?: string;
  [key: string]: unknown;
}

export type LangGraphToolEvent =
  | { event: "on_tool_start"; name: string; toolCallId: string; input?: unknown }
  | { event: "on_tool_event"; name: string; toolCallId: string; data?: unknown }
  | { event: "on_tool_end"; name: string; toolCallId: string; output?: unknown }
  | { event: "on_tool_error"; name: string; toolCallId: string; error: unknown };

export type LangGraphStreamChunk =
  | ["messages", [LangGraphMessageChunk, LangGraphMessageMetadata]]
  | ["updates", Record<string, unknown>]
  | ["tools", LangGraphToolEvent];

export interface LangGraphAdapterOptions {
  threadId: string;
  runId: string;
  title?: string;
  now?: () => number;
  createId?: () => string;
  messageId?: (message: LangGraphMessageChunk, metadata: LangGraphMessageMetadata) => string;
  toolCallId?: (event: LangGraphToolEvent) => string;
}

/**
 * Dependency-free subset of the StateSnapshot returned by
 * `graph.getStateHistory()`. Sensitive provider fields are represented only so
 * callers can pass the reviewed upstream shape without installing LangGraph.
 */
export interface LangGraphStateSnapshot {
  values?: unknown;
  next?: readonly string[];
  config?: {
    configurable?: {
      thread_id?: unknown;
      checkpoint_id?: unknown;
      checkpoint_ns?: unknown;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
  metadata?: {
    source?: unknown;
    writes?: unknown;
    step?: unknown;
    [key: string]: unknown;
  };
  createdAt?: unknown;
  parentConfig?: unknown;
  tasks?: readonly unknown[];
  [key: string]: unknown;
}

export type LangGraphCheckpointDecision =
  | { compatibility: "compatible"; status: "available" | "superseded"; restorable: boolean; reason?: string }
  | { compatibility: "incompatible"; status: "incompatible"; restorable: false; reason: string }
  | { compatibility: "unavailable"; status: "expired" | "failed" | "superseded"; restorable: false; reason: string };

/** One deliberately curated public checkpoint. History is never auto-exposed. */
export interface LangGraphCheckpointCandidate {
  snapshot: LangGraphStateSnapshot;
  /** Host-issued opaque identity. Never pass a provider checkpoint ID here. */
  id: string;
  /** Host-managed optimistic concurrency version. */
  version: number;
  kind: AgentCheckpointKind;
  title: string;
  summary?: string;
  decision: LangGraphCheckpointDecision;
  sourceTaskId?: string;
  sourceTaskVersion?: number;
}

export interface LangGraphCheckpointHistoryOptions {
  threadId: string;
  candidates: readonly LangGraphCheckpointCandidate[];
  createEventId?: (candidate: LangGraphCheckpointCandidate, index: number) => string;
}

/**
 * Projects an explicitly curated LangGraph history into provider-neutral
 * checkpoints. Raw graph state, writes, tasks and provider persistence handles
 * are intentionally unreachable from the returned event model.
 */
export function projectLangGraphCheckpointHistory(options: LangGraphCheckpointHistoryOptions): AIFrontEvent[] {
  requireNonEmpty(options.threadId, "threadId");
  const publicIds = new Set<string>();

  const prepared = options.candidates.map((candidate, index) => {
    requireNonEmpty(candidate.id, `candidates[${index}].id`);
    if (publicIds.has(candidate.id)) throw new TypeError(`candidates[${index}].id must be unique.`);
    publicIds.add(candidate.id);
    requirePositiveInteger(candidate.version, `candidates[${index}].version`);
    requireCheckpointKind(candidate.kind, index);
    requireNonEmpty(candidate.title, `candidates[${index}].title`);
    if (candidate.summary !== undefined) requireNonEmpty(candidate.summary, `candidates[${index}].summary`);
    if (candidate.sourceTaskId !== undefined) requireNonEmpty(candidate.sourceTaskId, `candidates[${index}].sourceTaskId`);
    if (candidate.sourceTaskVersion !== undefined) requirePositiveInteger(candidate.sourceTaskVersion, `candidates[${index}].sourceTaskVersion`);
    validateCheckpointDecision(candidate.decision, index);

    const sequence = candidate.snapshot.metadata?.step;
    if (!Number.isInteger(sequence) || (sequence as number) < 0) {
      throw new TypeError(`candidates[${index}].snapshot.metadata.step must be a non-negative integer.`);
    }
    const createdAt = parseIsoTimestamp(candidate.snapshot.createdAt, index);
    return { candidate, index, sequence: sequence as number, createdAt };
  });

  prepared.sort((left, right) => left.sequence - right.sequence || left.index - right.index);
  return prepared.map(({ candidate, index, sequence, createdAt }) => {
    const checkpoint: AgentCheckpoint = {
      id: candidate.id,
      version: candidate.version,
      sequence,
      kind: candidate.kind,
      title: candidate.title,
      status: candidate.decision.status,
      restorable: candidate.decision.restorable,
      createdAt,
      updatedAt: createdAt,
      ...(candidate.summary === undefined ? {} : { summary: candidate.summary }),
      ...(candidate.sourceTaskId === undefined ? {} : { sourceTaskId: candidate.sourceTaskId }),
      ...(candidate.sourceTaskVersion === undefined ? {} : { sourceTaskVersion: candidate.sourceTaskVersion }),
      ...(candidate.decision.reason === undefined ? {} : { reason: candidate.decision.reason })
    };
    const id = options.createEventId?.(candidate, index) ?? `langgraph-checkpoint:${candidate.id}:v${candidate.version}`;
    requireNonEmpty(id, `checkpoint event id for candidates[${index}]`);
    return { schemaVersion: 4, id, threadId: options.threadId, timestamp: createdAt, type: "checkpoint.updated", checkpoint };
  });
}

/**
 * Reference adapter for LangGraph's dependency-free `streamMode` tuple shapes.
 * The caller owns graph execution and passes only `messages`, `updates` and
 * `tools` chunks into this adapter.
 */
export function createLangGraphAdapter(options: LangGraphAdapterOptions) {
  let sequence = 0;
  const createId = options.createId ?? (() => `langgraph-${++sequence}`);
  const now = options.now ?? Date.now;
  const openMessages = new Set<string>();
  const runningNodes = new Map<string, string>();
  const toolNames = new Map<string, string>();
  let stepSequence = 0;
  const envelope = (timestamp = now()) => ({ schemaVersion: 4 as const, id: createId(), threadId: options.threadId, timestamp });
  const resolveMessageId = options.messageId ?? ((message: LangGraphMessageChunk) => message.id ?? `message:${options.runId}`);
  const resolveToolCallId = options.toolCallId ?? ((event: LangGraphToolEvent) => event.toolCallId);

  return {
    start(): AIFrontEvent[] {
      return [{ ...envelope(), type: "task.started", taskId: options.runId, title: options.title ?? "LangGraph run", metadata: { adapter: "langgraph" } }];
    },

    adapt(chunk: LangGraphStreamChunk): AIFrontEvent[] {
      const [mode, data] = chunk;
      if (mode === "messages") {
        const [message, metadata] = data;
        const messageId = resolveMessageId(message, metadata);
        const partId = `text:${messageId}`;
        const events: AIFrontEvent[] = [];
        if (!openMessages.has(messageId)) {
          openMessages.add(messageId);
          events.push(
            { ...envelope(), type: "message.started", messageId, role: "assistant" },
            { ...envelope(), type: "message.part.added", messageId, partId, part: { type: "text", text: "", partStatus: "streaming" } }
          );
        }
        const node = metadata.langgraph_node;
        if (node && !runningNodes.has(node)) {
          const stepId = `node:${node}:${++stepSequence}`;
          runningNodes.set(node, stepId);
          const timestamp = now();
          events.push({ ...envelope(timestamp), type: "task.step.updated", taskId: options.runId, step: { id: stepId, taskId: options.runId, title: node, status: "running", startedAt: timestamp } });
        }
        const text = extractText(message);
        if (text) events.push({ ...envelope(), type: "message.part.delta", messageId, partId, delta: text });
        return events;
      }

      if (mode === "updates") {
        return Object.keys(data).flatMap((node) => {
          const stepId = runningNodes.get(node) ?? `node:${node}:${++stepSequence}`;
          runningNodes.delete(node);
          const timestamp = now();
          return [{ ...envelope(timestamp), type: "task.step.updated" as const, taskId: options.runId, step: { id: stepId, taskId: options.runId, title: node, status: "complete" as const, completedAt: timestamp } }];
        });
      }

      const toolCallId = resolveToolCallId(data);
      toolNames.set(toolCallId, data.name);
      switch (data.event) {
        case "on_tool_start":
          return [{ ...envelope(), type: "tool.updated", toolCallId, name: data.name, status: "running", ...(data.input === undefined ? {} : { input: data.input }) }];
        case "on_tool_event":
          return [{ ...envelope(), type: "tool.updated", toolCallId, name: data.name, status: "output-available", ...(data.data === undefined ? {} : { output: data.data }) }];
        case "on_tool_end":
          return [{ ...envelope(), type: "tool.updated", toolCallId, name: data.name, status: "complete", ...(data.output === undefined ? {} : { output: data.output }) }];
        case "on_tool_error":
          return [{ ...envelope(), type: "tool.updated", toolCallId, name: toolNames.get(toolCallId) ?? data.name, status: "failed", error: errorMessage(data.error) }];
      }
    },

    finish(): AIFrontEvent[] {
      const events: AIFrontEvent[] = [];
      for (const messageId of openMessages) {
        events.push(
          { ...envelope(), type: "message.part.status", messageId, partId: `text:${messageId}`, status: "complete" },
          { ...envelope(), type: "message.completed", messageId }
        );
      }
      openMessages.clear();
      for (const [node, stepId] of runningNodes) {
        const timestamp = now();
        events.push({ ...envelope(timestamp), type: "task.step.updated", taskId: options.runId, step: { id: stepId, taskId: options.runId, title: node, status: "complete", completedAt: timestamp } });
      }
      runningNodes.clear();
      events.push({ ...envelope(), type: "task.updated", taskId: options.runId, status: "complete" });
      return events;
    },

    fail(error: unknown): AIFrontEvent[] {
      const message = errorMessage(error);
      const events: AIFrontEvent[] = [];
      for (const messageId of openMessages) {
        events.push(
          { ...envelope(), type: "message.part.status", messageId, partId: `text:${messageId}`, status: "failed", error: message },
          { ...envelope(), type: "message.failed", messageId, error: message }
        );
      }
      openMessages.clear();
      for (const [node, stepId] of runningNodes) {
        const timestamp = now();
        events.push({ ...envelope(timestamp), type: "task.step.updated", taskId: options.runId, step: { id: stepId, taskId: options.runId, title: node, status: "failed", completedAt: timestamp, error: message } });
      }
      runningNodes.clear();
      events.push({ ...envelope(), type: "task.updated", taskId: options.runId, status: "failed", error: message });
      return events;
    }
  };
}

function extractText(message: LangGraphMessageChunk): string {
  if (typeof message.text === "string") return message.text;
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content
    .map((part) => part && typeof part === "object" && "text" in part && typeof part.text === "string" ? part.text : "")
    .join("");
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : typeof error === "string" ? error : "LangGraph run failed";
}

function requireNonEmpty(value: unknown, label: string) {
  if (typeof value !== "string" || value.trim() === "") throw new TypeError(`${label} must be a non-empty string.`);
}

function requirePositiveInteger(value: unknown, label: string) {
  if (!Number.isInteger(value) || (value as number) < 1) throw new TypeError(`${label} must be a positive integer.`);
}

function requireCheckpointKind(value: unknown, index: number) {
  if (value !== "automatic" && value !== "manual" && value !== "approval-boundary" && value !== "interruption") {
    throw new TypeError(`candidates[${index}].kind is not a supported checkpoint kind.`);
  }
}

function validateCheckpointDecision(decision: LangGraphCheckpointDecision | undefined, index: number) {
  if (!decision || typeof decision !== "object") {
    throw new TypeError(`candidates[${index}].decision requires an explicit compatibility decision.`);
  }
  if (decision.compatibility === "compatible") {
    if (decision.status !== "available" && decision.status !== "superseded") {
      throw new TypeError(`candidates[${index}].decision has an invalid compatible status.`);
    }
    if (decision.status === "superseded" && decision.restorable !== false) {
      throw new TypeError(`candidates[${index}].decision must mark a superseded checkpoint as non-restorable.`);
    }
  } else if (decision.compatibility === "incompatible") {
    if (decision.status !== "incompatible" || decision.restorable !== false) {
      throw new TypeError(`candidates[${index}].decision must normalize incompatibility as a non-restorable incompatible checkpoint.`);
    }
  } else if (decision.compatibility === "unavailable") {
    if ((decision.status !== "expired" && decision.status !== "failed" && decision.status !== "superseded") || decision.restorable !== false) {
      throw new TypeError(`candidates[${index}].decision must normalize unavailability as a non-restorable terminal checkpoint.`);
    }
  } else {
    throw new TypeError(`candidates[${index}].decision requires an explicit compatibility decision.`);
  }
  if (decision.reason !== undefined) requireNonEmpty(decision.reason, `candidates[${index}].decision.reason`);
}

function parseIsoTimestamp(value: unknown, index: number): number {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value) : null;
  if (!match) {
    throw new TypeError(`candidates[${index}].snapshot.createdAt must be an ISO 8601 timestamp.`);
  }
  const [, yearText, monthText, dayText, hourText, minuteText, secondText, offsetHourText, offsetMinuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const offsetHour = offsetHourText === undefined ? 0 : Number(offsetHourText);
  const offsetMinute = offsetMinuteText === undefined ? 0 : Number(offsetMinuteText);
  const daysInMonth = month >= 1 && month <= 12 ? new Date(Date.UTC(year, month, 0)).getUTCDate() : 0;
  if (day < 1 || day > daysInMonth || hour > 23 || minute > 59 || second > 59 || offsetHour > 23 || offsetMinute > 59) {
    throw new TypeError(`candidates[${index}].snapshot.createdAt must be a valid timestamp.`);
  }
  const timestamp = Date.parse(value as string);
  if (!Number.isFinite(timestamp)) throw new TypeError(`candidates[${index}].snapshot.createdAt must be a valid timestamp.`);
  return timestamp;
}
