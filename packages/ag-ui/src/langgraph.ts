import type { AIFrontEvent } from "@aifrontkit/core";

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
  const envelope = (timestamp = now()) => ({ schemaVersion: 3 as const, id: createId(), threadId: options.threadId, timestamp });
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
