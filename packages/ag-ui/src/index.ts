import type { AIFrontEvent } from "@aifrontkit/core";

export * from "./external-store.js";
export * from "./langgraph.js";

export type AGUIEvent =
  | { type: "RUN_STARTED"; runId: string; threadId?: string; parentRunId?: string; input?: unknown; timestamp?: number }
  | { type: "RUN_FINISHED"; runId: string; threadId?: string; result?: unknown; timestamp?: number }
  | { type: "STEP_STARTED"; stepName: string; timestamp?: number }
  | { type: "STEP_FINISHED"; stepName: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_START"; messageId: string; role?: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_END"; messageId: string; timestamp?: number }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string; parentMessageId?: string; timestamp?: number }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string; timestamp?: number }
  | { type: "TOOL_CALL_END"; toolCallId: string; timestamp?: number }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: unknown; messageId?: string; timestamp?: number }
  | { type: "REASONING_START"; messageId: string; timestamp?: number }
  | { type: "REASONING_MESSAGE_START"; messageId: string; role: "reasoning"; timestamp?: number }
  | { type: "REASONING_MESSAGE_CONTENT"; messageId: string; delta: string; timestamp?: number }
  | { type: "REASONING_MESSAGE_END"; messageId: string; timestamp?: number }
  | { type: "REASONING_END"; messageId: string; timestamp?: number }
  | { type: "RUN_ERROR"; message: string; code?: string; timestamp?: number };

export function createAGUIAdapter(options: { threadId: string; createId?: () => string; now?: () => number; taskTitle?: (runId: string) => string }) {
  let sequence = 0;
  const createId = options.createId ?? (() => `ag-ui-${++sequence}`);
  const now = options.now ?? Date.now;
  const toolNames = new Map<string, string>();
  const toolArguments = new Map<string, string>();
  const toolMessages = new Map<string, string>();
  const stepIds = new Map<string, string>();
  let stepSequence = 0;
  let activeRunId: string | undefined;
  const envelope = (timestamp: number) => ({ schemaVersion: 3 as const, id: createId(), threadId: options.threadId, timestamp });

  return {
    adapt(event: AGUIEvent): AIFrontEvent[] {
      const timestamp = event.timestamp ?? now();
      switch (event.type) {
        case "RUN_STARTED":
          activeRunId = event.runId;
          stepIds.clear();
          return [{ ...envelope(timestamp), type: "task.started", taskId: event.runId, title: options.taskTitle?.(event.runId) ?? "Agent run" }];
        case "RUN_FINISHED": {
          const events: AIFrontEvent[] = Array.from(stepIds, ([title, id]) => ({
            ...envelope(timestamp),
            type: "task.step.updated",
            taskId: event.runId,
            step: { id, taskId: event.runId, title, status: "complete", completedAt: timestamp }
          }));
          stepIds.clear();
          activeRunId = undefined;
          events.push({ ...envelope(timestamp), type: "task.updated", taskId: event.runId, status: "complete" });
          return events;
        }
        case "STEP_STARTED": {
          if (!activeRunId) return [];
          const stepId = `step:${++stepSequence}`;
          stepIds.set(event.stepName, stepId);
          return [{ ...envelope(timestamp), type: "task.step.updated", taskId: activeRunId, step: { id: stepId, taskId: activeRunId, title: event.stepName, status: "running", startedAt: timestamp } }];
        }
        case "STEP_FINISHED": {
          if (!activeRunId) return [];
          const stepId = stepIds.get(event.stepName) ?? `step:${event.stepName}`;
          stepIds.delete(event.stepName);
          return [{ ...envelope(timestamp), type: "task.step.updated", taskId: activeRunId, step: { id: stepId, taskId: activeRunId, title: event.stepName, status: "complete", completedAt: timestamp } }];
        }
        case "TEXT_MESSAGE_START":
          return [
            { ...envelope(timestamp), type: "message.started", messageId: event.messageId, role: event.role === "user" ? "user" : "assistant" },
            { ...envelope(timestamp), type: "message.part.added", messageId: event.messageId, partId: `text:${event.messageId}`, part: { type: "text", text: "", partStatus: "streaming" } }
          ];
        case "TEXT_MESSAGE_CONTENT":
          return [{ ...envelope(timestamp), type: "message.part.delta", messageId: event.messageId, partId: `text:${event.messageId}`, delta: event.delta }];
        case "TEXT_MESSAGE_END":
          return [
            { ...envelope(timestamp), type: "message.part.status", messageId: event.messageId, partId: `text:${event.messageId}`, status: "complete" },
            { ...envelope(timestamp), type: "message.completed", messageId: event.messageId }
          ];
        case "REASONING_MESSAGE_START":
          return [
            { ...envelope(timestamp), type: "message.started", messageId: event.messageId, role: "assistant" },
            { ...envelope(timestamp), type: "message.part.added", messageId: event.messageId, partId: `reasoning:${event.messageId}`, part: { type: "reasoning", text: "", visible: true, partStatus: "streaming" } }
          ];
        case "REASONING_MESSAGE_CONTENT":
          return [{ ...envelope(timestamp), type: "message.part.delta", messageId: event.messageId, partId: `reasoning:${event.messageId}`, delta: event.delta }];
        case "REASONING_MESSAGE_END":
          return [
            { ...envelope(timestamp), type: "message.part.status", messageId: event.messageId, partId: `reasoning:${event.messageId}`, status: "complete" },
            { ...envelope(timestamp), type: "message.completed", messageId: event.messageId }
          ];
        case "REASONING_START":
        case "REASONING_END":
          return [];
        case "TOOL_CALL_START":
          toolNames.set(event.toolCallId, event.toolCallName);
          if (event.parentMessageId) toolMessages.set(event.toolCallId, event.parentMessageId);
          return [{ ...envelope(timestamp), type: "tool.updated", toolCallId: event.toolCallId, ...(event.parentMessageId === undefined ? {} : { messageId: event.parentMessageId, partId: `tool:${event.toolCallId}` }), name: event.toolCallName, status: "input-streaming" }];
        case "TOOL_CALL_ARGS": {
          const args = (toolArguments.get(event.toolCallId) ?? "") + event.delta;
          toolArguments.set(event.toolCallId, args);
          const messageId = toolMessages.get(event.toolCallId);
          return [{ ...envelope(timestamp), type: "tool.updated", toolCallId: event.toolCallId, ...(messageId ? { messageId, partId: `tool:${event.toolCallId}` } : {}), name: toolNames.get(event.toolCallId) ?? "unknown", status: "input-streaming", input: parseArguments(args) }];
        }
        case "TOOL_CALL_END": {
          const messageId = toolMessages.get(event.toolCallId);
          return [{ ...envelope(timestamp), type: "tool.updated", toolCallId: event.toolCallId, ...(messageId ? { messageId, partId: `tool:${event.toolCallId}` } : {}), name: toolNames.get(event.toolCallId) ?? "unknown", status: "running", input: parseArguments(toolArguments.get(event.toolCallId) ?? "") }];
        }
        case "TOOL_CALL_RESULT": {
          const messageId = toolMessages.get(event.toolCallId);
          return [{ ...envelope(timestamp), type: "tool.updated", toolCallId: event.toolCallId, ...(messageId ? { messageId, partId: `tool:${event.toolCallId}` } : {}), name: toolNames.get(event.toolCallId) ?? "unknown", status: "complete", output: event.content }];
        }
        case "RUN_ERROR": {
          if (!activeRunId) return [];
          const taskId = activeRunId;
          const events: AIFrontEvent[] = Array.from(stepIds, ([title, id]) => ({
            ...envelope(timestamp),
            type: "task.step.updated",
            taskId,
            step: { id, taskId, title, status: "failed", completedAt: timestamp, error: event.message }
          }));
          stepIds.clear();
          activeRunId = undefined;
          events.push({ ...envelope(timestamp), type: "task.updated", taskId, status: "failed", error: event.message });
          return events;
        }
        default:
          return [];
      }
    }
  };
}

function parseArguments(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
