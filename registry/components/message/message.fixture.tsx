import { createRuntime, type AIFrontEvent, type Runtime } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Message } from "./message.js";
import { messageQualityScenarios } from "./message.quality.fixture.js";

/** The message fixture is a renderable, deterministic component contract, not a string-only catalog. */
export { messageQualityScenarios };
export type MessageFixtureId = (typeof messageQualityScenarios)[number]["id"];

type MessageInput = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  status?: "complete" | "streaming" | "interrupted" | "failed";
  reason?: string;
};

function runtimeFor(threadId: string, message: MessageInput): Runtime {
  const events: AIFrontEvent[] = [
    { schemaVersion: 1, id: `${threadId}-started`, threadId, timestamp: 1, type: "message.started", messageId: message.id, role: message.role },
    ...(message.text ? [{ schemaVersion: 1 as const, id: `${threadId}-delta`, threadId, timestamp: 2, type: "message.delta" as const, messageId: message.id, delta: message.text }] : []),
  ];
  if (message.status === "failed") events.push({ schemaVersion: 1, id: `${threadId}-failed`, threadId, timestamp: 3, type: "message.failed", messageId: message.id, error: message.reason ?? "Connection interrupted. Your partial response is preserved." });
  else if (message.status === "interrupted") events.push({ schemaVersion: 1, id: `${threadId}-interrupted`, threadId, timestamp: 3, type: "message.interrupted", messageId: message.id, reason: message.reason ?? "Stopped by the user. Partial response preserved." });
  else if (message.status !== "streaming") events.push({ schemaVersion: 1, id: `${threadId}-completed`, threadId, timestamp: 3, type: "message.completed", messageId: message.id });
  return createRuntime(threadId, events);
}

export function createMessageFixtureRuntime(scenario: MessageFixtureId): Runtime {
  switch (scenario) {
    case "streaming":
      return runtimeFor("message-streaming", { id: "fixture-assistant", role: "assistant", text: "Here is a deterministic streaming message fixture that remains readable while output is in progress.", status: "streaming" });
    case "interrupted":
      return runtimeFor("message-interrupted", { id: "fixture-assistant", role: "assistant", text: "The first stage is complete, but the response was stopped before the remaining recommendations.", status: "interrupted", reason: "Stopped by the user. Partial response preserved." });
    case "failed":
      return runtimeFor("message-failed", { id: "fixture-assistant", role: "assistant", text: "The response started successfully, but the final review could not be loaded.", status: "failed", reason: "Connection interrupted. Your partial response is preserved." });
    case "long-content":
      return runtimeFor("message-long-content", { id: "fixture-assistant", role: "assistant", text: "A readable message keeps prose at a useful measure and lets long values wrap without breaking its container.\n\nhttps://aifrontkit.dev/docs/components/message/quality/fixtures/long-content\n\nUnbroken-message-content_identifier_that_must_wrap_without_horizontal_page_overflow." });
    case "user-role":
      return runtimeFor("message-user", { id: "fixture-user", role: "user", text: "Keep the user message distinct, compact, and easy to scan." });
    case "system-role":
      return runtimeFor("message-system", { id: "fixture-system", role: "system", text: "Workspace context updated · three files selected" });
    case "without-slots":
      return runtimeFor("message-without-slots", { id: "fixture-assistant", role: "assistant", text: "Optional presentation slots leave no empty rows when they are not provided." });
    case "rtl":
      return runtimeFor("message-rtl", { id: "fixture-assistant", role: "assistant", text: "نحافظ على ترتيب دلالي واضح ومسافات هادئة في كل اتجاه قراءة." });
    case "default":
    default:
      return runtimeFor("message-default", { id: "fixture-assistant", role: "assistant", text: "Here is a deterministic completed message with a quiet hierarchy and useful actions." });
  }
}

export function MessageFixture({ scenario = "default" }: { scenario?: MessageFixtureId }) {
  const runtime = createMessageFixtureRuntime(scenario);
  const messageId = runtime.getState().messageOrder[0] ?? "fixture-assistant";
  const isRecovery = scenario === "failed" || scenario === "interrupted";
  const isNoSlots = scenario === "without-slots";
  return (
    <AIFrontKitProvider runtime={runtime}>
      <Message
        messageId={messageId}
        variant={scenario === "user-role" ? "conversation" : scenario === "system-role" ? "minimal" : "conversation"}
        motion="none"
        announceStatus
        avatar={isNoSlots ? undefined : <span aria-hidden="true">✦</span>}
        metadata={isNoSlots ? undefined : <span>Just now</span>}
        recovery={isRecovery ? <button type="button">{scenario === "interrupted" ? "Continue" : "Try again"}</button> : undefined}
        actions={isNoSlots ? undefined : <><button type="button">Copy response</button><button type="button">Try again</button></>}
      />
    </AIFrontKitProvider>
  );
}
