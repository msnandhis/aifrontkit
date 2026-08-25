import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Message } from "./message";

/** Stable data for the docs/playground; no network, clock, or random values. */
export const messageFixtureEvents: AIFrontEvent[] = [
  { schemaVersion: 1, id: "fixture-1", threadId: "fixture-thread", timestamp: 1, type: "message.started", messageId: "fixture-assistant", role: "assistant" },
  { schemaVersion: 1, id: "fixture-2", threadId: "fixture-thread", timestamp: 2, type: "message.delta", messageId: "fixture-assistant", delta: "Here is a deterministic streaming message fixture." }
];

export function MessageFixture() {
  const runtime = createRuntime("fixture-thread", messageFixtureEvents);
  return <AIFrontKitProvider runtime={runtime}><Message messageId="fixture-assistant" variant="conversation" motion="none" /></AIFrontKitProvider>;
}
