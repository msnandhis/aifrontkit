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
  | { type: "reasoning-start"; id: string }
  | { type: "reasoning-delta"; id: string; delta: string }
  | { type: "reasoning-end"; id: string }
  | { type: "source-url"; sourceId: string; url: string; title?: string }
  | { type: "file"; id?: string; url: string; mediaType: string; filename?: string }
  | { type: `data-${string}`; id?: string; data: unknown }
  | { type: "error"; errorText: string }
  | { type: "abort"; reason?: string }
  | { type: "start-step" }
  | { type: "finish-step" }
  | { type: "tool-input-start"; toolCallId: string; toolName: string }
  | { type: "tool-input-delta"; toolCallId: string; inputTextDelta: string }
  | { type: "tool-input-available"; toolCallId: string; toolName: string; input: unknown }
  | { type: "tool-output-available"; toolCallId: string; output: unknown }
  | { type: "tool-output-error"; toolCallId: string; errorText: string }
  | { type: "tool-approval-request"; approvalId: string; toolCallId: string; summary?: string }
  | { type: "finish" };

export function createAISDKAdapter(context: AdapterContext) {
  let sequence = 0;
  let activeMessageId = context.messageId;
  let messageFailed = false;
  const toolNames = new Map<string, string>();
  const toolInput = new Map<string, string>();
  const now = context.now ?? Date.now;
  const createId = context.createId ?? (() => `ai-sdk-${++sequence}`);
  const envelope = () => ({ schemaVersion: 4 as const, id: createId(), threadId: context.threadId, timestamp: now() });

  return {
    protocolVersion: AI_SDK_UI_PROTOCOL,
    adapt(part: AISDKUIStreamPart): AIFrontEvent[] {
      switch (part.type) {
        case "start":
          activeMessageId = typeof part.messageId === "string" ? part.messageId : context.messageId;
          messageFailed = false;
          return [{ ...envelope(), type: "message.started", messageId: activeMessageId, role: "assistant" }];
        case "text-start":
          return [{ ...envelope(), type: "message.part.added", messageId: activeMessageId, partId: part.id, part: { type: "text", text: "", partStatus: "streaming" } }];
        case "text-delta":
          return [{ ...envelope(), type: "message.part.delta", messageId: activeMessageId, partId: part.id, delta: part.delta }];
        case "text-end":
          return [{ ...envelope(), type: "message.part.status", messageId: activeMessageId, partId: part.id, status: "complete" }];
        case "reasoning-start":
          return [{ ...envelope(), type: "message.part.added", messageId: activeMessageId, partId: part.id, part: { type: "reasoning", text: "", visible: true, partStatus: "streaming" } }];
        case "reasoning-delta":
          return [{ ...envelope(), type: "message.part.delta", messageId: activeMessageId, partId: part.id, delta: part.delta }];
        case "reasoning-end":
          return [{ ...envelope(), type: "message.part.status", messageId: activeMessageId, partId: part.id, status: "complete" }];
        case "source-url":
          return [{ ...envelope(), type: "message.part.added", messageId: activeMessageId, partId: `source:${part.sourceId}`, part: { type: "source", sourceId: part.sourceId, url: part.url, ...(part.title === undefined ? {} : { title: part.title }) } }];
        case "file":
          return [{ ...envelope(), type: "message.part.added", messageId: activeMessageId, partId: part.id ?? `file:${createId()}`, part: { type: "file", name: part.filename ?? "File", mediaType: part.mediaType, source: { kind: "url", url: part.url } } }];
        case "error":
          messageFailed = true;
          return [{ ...envelope(), type: "message.failed", messageId: activeMessageId, error: part.errorText }];
        case "abort":
          messageFailed = true;
          return [{ ...envelope(), type: "message.interrupted", messageId: activeMessageId, ...(part.reason === undefined ? {} : { reason: part.reason }) }];
        case "start-step":
        case "finish-step":
          // AI SDK steps join multiple model calls inside one assistant message.
          // They are transport boundaries rather than user-facing agent tasks.
          return [];
        case "finish":
          return messageFailed ? [] : [{ ...envelope(), type: "message.completed", messageId: activeMessageId }];
        case "tool-input-start":
          toolNames.set(part.toolCallId, part.toolName);
          toolInput.set(part.toolCallId, "");
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, partId: `tool:${part.toolCallId}`, name: part.toolName, status: "input-streaming" }];
        case "tool-input-delta": {
          const input = (toolInput.get(part.toolCallId) ?? "") + part.inputTextDelta;
          toolInput.set(part.toolCallId, input);
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, partId: `tool:${part.toolCallId}`, name: toolNames.get(part.toolCallId) ?? "unknown", status: "input-streaming", input: parseInput(input) }];
        }
        case "tool-input-available":
          toolNames.set(part.toolCallId, part.toolName);
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, partId: `tool:${part.toolCallId}`, name: part.toolName, status: "running", input: part.input }];
        case "tool-output-available":
          return [toolEvent("complete", part.toolCallId, part.output)];
        case "tool-output-error":
          return [{ ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, partId: `tool:${part.toolCallId}`, name: toolNames.get(part.toolCallId) ?? "unknown", status: "failed", error: part.errorText }];
        case "tool-approval-request":
          return [
            { ...envelope(), type: "tool.updated", toolCallId: part.toolCallId, messageId: activeMessageId, partId: `tool:${part.toolCallId}`, name: toolNames.get(part.toolCallId) ?? "unknown", status: "approval-requested" },
            { ...envelope(), type: "approval.requested", approvalId: part.approvalId, toolCallId: part.toolCallId, summary: part.summary ?? `Approve ${toolNames.get(part.toolCallId) ?? "tool"}` }
          ];
        default:
          if (part.type.startsWith("data-")) return [{ ...envelope(), type: "message.part.added", messageId: activeMessageId, partId: part.id ?? `${part.type}:${createId()}`, part: { type: "data", name: part.type.slice(5), data: part.data } }];
          return [];
      }
    }
  };

  function toolEvent(status: ToolStatus, toolCallId: string, output: unknown): AIFrontEvent {
    return { ...envelope(), type: "tool.updated", toolCallId, messageId: activeMessageId, partId: `tool:${toolCallId}`, name: toolNames.get(toolCallId) ?? "unknown", status, output };
  }
}

function parseInput(value: string): unknown {
  try { return JSON.parse(value); } catch { return value; }
}
