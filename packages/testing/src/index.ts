import type { AIFrontEvent } from "@aifrontkit/core";

export function conversationFixture(threadId = "fixture-thread"): readonly AIFrontEvent[] {
  return [
    { schemaVersion: 1, id: "fixture-1", threadId, timestamp: 1, type: "message.started", messageId: "assistant-1", role: "assistant" },
    { schemaVersion: 1, id: "fixture-2", threadId, timestamp: 2, type: "message.delta", messageId: "assistant-1", delta: "Deterministic fixture" },
    { schemaVersion: 1, id: "fixture-3", threadId, timestamp: 3, type: "message.completed", messageId: "assistant-1" }
  ];
}

export const supportedSchemaMajors = [1] as const;
