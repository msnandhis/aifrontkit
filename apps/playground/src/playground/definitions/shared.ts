import { createRuntimeFromMessages, type Message, type MessageRole, type MessageStatus } from "@aifrontkit/core";
import { environmentDefaults, type PlaygroundEnvironment } from "../types.js";

export function messageModel(id: string, role: MessageRole, status: MessageStatus, text: string, reason?: string): Message {
  return {
    id,
    threadId: "playground-thread",
    role,
    status,
    parts: [{ type: "text", text }],
    createdAt: 1,
    ...(status === "complete" ? { completedAt: 2 } : {}),
    ...(status === "failed" ? { error: reason ?? "Connection interrupted. Your partial response is preserved." } : {}),
    ...(status === "interrupted" ? { interruptionReason: reason ?? "Stopped by the user. Partial response preserved." } : {}),
  };
}

export function runtimeFrom(messages: readonly Message[]) {
  return createRuntimeFromMessages("playground-thread", messages);
}

export function playgroundEnvironment(overrides: Partial<PlaygroundEnvironment> = {}): PlaygroundEnvironment {
  return { ...environmentDefaults, ...overrides };
}

export function q(value: string) {
  return JSON.stringify(value);
}

export function messageCode(messages: readonly Message[]) {
  if (!messages.length) return "const messages: MessageModel[] = [];";
  const rows = messages.map((message) => {
    const part = message.parts[0];
    const text = part?.type === "text" ? part.text : "";
    const lines = [
      "  {",
      "    id: " + q(message.id) + ",",
      "    threadId: \"playground-thread\",",
      "    role: " + q(message.role) + ",",
      "    status: " + q(message.status) + ",",
      "    parts: [{ type: \"text\", text: " + q(text) + " }],",
      "    createdAt: 1,",
      message.completedAt === undefined ? "" : "    completedAt: 2,",
      message.error ? "    error: " + q(message.error) + "," : "",
      message.interruptionReason ? "    interruptionReason: " + q(message.interruptionReason) + "," : "",
      "  }",
    ];
    return lines.filter(Boolean).join("\n");
  });
  return ["const messages: MessageModel[] = [", rows.join(",\n"), "];"].join("\n");
}

export const directionOptions = [{ label: "Left to right", value: "ltr" }, { label: "Right to left", value: "rtl" }] as const;
export const statusOptions = [
  { label: "Complete", value: "complete" },
  { label: "Streaming", value: "streaming" },
  { label: "Interrupted", value: "interrupted" },
  { label: "Failed", value: "failed" },
] as const;
