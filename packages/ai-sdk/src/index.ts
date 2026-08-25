import type { AIFrontEvent, ToolStatus } from "@aifrontkit/core";

export const AI_SDK_UI_PROTOCOL = "v1" as const;

export interface AdapterContext {
  threadId: string;
  messageId: string;
  now?: () => number;
  createId?: () => string;
}

export type AISDKUIStreamPart =
  | { type: "start"; messageId?: string }
  | { type: "text-start"; id: string }
  | { type: "text-delta"; id: string; delta: string }
  | { type: "text-end"; id: string }
  | { type: "tool-input-available"; toolCallId: string; toolName: string; input: unknown }
  | { type: "tool-output-available"; toolCallId: string; output: unknown }
  | { type: "tool-output-error"; toolCallId: string; errorText: string }
  | { type: "finish" };

export function createAISDKAdapter(context: AdapterContext) {
  let sequence = 0;
  let activeMessageId = context.messageId;
  const toolNames = new Map<string, string>();
  const now = context.now ?? Date.now;
  const createId = context.createId ?? (() => `ai-sdk-${++sequence}`);
  const envelope = () => ({ schemaVersion: 1 as const, id: createId(), threadId: context.threadId, timestamp: now() });

  return {
    protocolVersion: AI_SDK_UI_PROTOCOL,
    adapt(part: AISDKUIStreamPart): AIFrontEvent[] {
      switch (part.type) {
        case "start":
          activeMessageId = typeof part.messageId === "string" ? part.messageId : context.messageId;
          return [{ ...envelope(), type: "message.started", messageId: activeMessageId, role: "assistant" }];
        case "text-start":
          return [];
        case "text-delta":
          return [{ ...envelope(), type: "message.delta", messageId: activeMessageId, delta: part.delta }];
        case "text-end":
          return [];
        case "finish":
          return [{ ...envelope(), type: "message.completed", messageId: activeMessageId }];
        case "tool-input-available":
          toolNames.set(part.toolCallId, part.toolName);
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, name: part.toolName, status: "running", input: part.input }];
        case "tool-output-available":
          return [toolEvent("complete", part.toolCallId, part.output)];
        case "tool-output-error":
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, name: toolNames.get(part.toolCallId) ?? "unknown", status: "failed", error: part.errorText }];
        default:
          return [];
      }
    }
  };

  function toolEvent(status: ToolStatus, toolCallId: string, output: unknown): AIFrontEvent {
    return { ...envelope(), type: "tool.updated", toolCallId, messageId: activeMessageId, name: toolNames.get(toolCallId) ?? "unknown", status, output };
  }
}
