import type { AIFrontEvent } from "@aifrontkit/core";

export type AGUIEvent =
  | { type: "TEXT_MESSAGE_START"; messageId: string; role?: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_CONTENT"; messageId: string; delta: string; timestamp?: number }
  | { type: "TEXT_MESSAGE_END"; messageId: string; timestamp?: number }
  | { type: "TOOL_CALL_START"; toolCallId: string; toolCallName: string; parentMessageId?: string; timestamp?: number }
  | { type: "TOOL_CALL_ARGS"; toolCallId: string; delta: string; timestamp?: number }
  | { type: "TOOL_CALL_RESULT"; toolCallId: string; content: unknown; messageId?: string; timestamp?: number }
  | { type: "RUN_ERROR"; message: string; timestamp?: number };

export function createAGUIAdapter(options: { threadId: string; createId?: () => string; now?: () => number }) {
  let sequence = 0;
  const createId = options.createId ?? (() => `ag-ui-${++sequence}`);
  const now = options.now ?? Date.now;
  const toolNames = new Map<string, string>();
  const toolArguments = new Map<string, string>();
  const envelope = (event: AGUIEvent) => ({ schemaVersion: 1 as const, id: createId(), threadId: options.threadId, timestamp: event.timestamp ?? now() });

  return {
    adapt(event: AGUIEvent): AIFrontEvent[] {
      switch (event.type) {
        case "TEXT_MESSAGE_START":
          return [{ ...envelope(event), type: "message.started", messageId: event.messageId, role: event.role === "user" ? "user" : "assistant" }];
        case "TEXT_MESSAGE_CONTENT":
          return [{ ...envelope(event), type: "message.delta", messageId: event.messageId, delta: event.delta }];
        case "TEXT_MESSAGE_END":
          return [{ ...envelope(event), type: "message.completed", messageId: event.messageId }];
        case "TOOL_CALL_START":
          toolNames.set(event.toolCallId, event.toolCallName);
          return [{ ...envelope(event), type: "tool.updated", toolCallId: event.toolCallId, ...(event.parentMessageId === undefined ? {} : { messageId: event.parentMessageId }), name: event.toolCallName, status: "pending" }];
        case "TOOL_CALL_ARGS": {
          const args = (toolArguments.get(event.toolCallId) ?? "") + event.delta;
          toolArguments.set(event.toolCallId, args);
          return [{ ...envelope(event), type: "tool.updated", toolCallId: event.toolCallId, name: toolNames.get(event.toolCallId) ?? "unknown", status: "running", input: parseArguments(args) }];
        }
        case "TOOL_CALL_RESULT":
          return [{ ...envelope(event), type: "tool.updated", toolCallId: event.toolCallId, ...(event.messageId === undefined ? {} : { messageId: event.messageId }), name: toolNames.get(event.toolCallId) ?? "unknown", status: "complete", output: event.content }];
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
