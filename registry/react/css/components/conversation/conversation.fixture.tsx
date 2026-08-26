import { createRuntime, type AIFrontEvent, type Runtime } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Message } from "../message/message.js";
import { PromptInput } from "../prompt-input/prompt-input.js";
import { Conversation } from "./conversation.js";
import { conversationQualityScenarios } from "./conversation.quality.fixture.js";

/** The deterministic scenario contract is shared by the quality validator and the Component Lab. */
export { conversationQualityScenarios };
export type ConversationFixtureId = (typeof conversationQualityScenarios)[number]["id"];

export interface ConversationFixtureProps {
  scenario?: ConversationFixtureId;
  className?: string;
}

type MessageInput = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  status?: "complete" | "streaming" | "interrupted" | "failed";
  reason?: string;
};

function runtimeFor(threadId: string, messages: MessageInput[] = []): Runtime {
  let sequence = 0;
  type MessageEventInput =
    | { type: "message.started"; messageId: string; role: "user" | "assistant" | "system" }
    | { type: "message.delta"; messageId: string; delta: string }
    | { type: "message.completed"; messageId: string }
    | { type: "message.interrupted"; messageId: string; reason?: string }
    | { type: "message.failed"; messageId: string; error: string };
  const event = (input: MessageEventInput): AIFrontEvent => ({
    ...input,
    schemaVersion: 1,
    id: `${threadId}-${++sequence}`,
    threadId,
    timestamp: sequence,
  });
  const events: AIFrontEvent[] = [];
  for (const message of messages) {
    events.push(event({ type: "message.started", messageId: message.id, role: message.role }));
    if (message.text) events.push(event({ type: "message.delta", messageId: message.id, delta: message.text }));
    if (message.status === "failed") {
      events.push(event({ type: "message.failed", messageId: message.id, error: message.reason ?? "The response could not be completed." }));
    } else if (message.status === "interrupted") {
      events.push(event({ type: "message.interrupted", messageId: message.id, reason: message.reason ?? "Stopped by the user. Partial response preserved." }));
    } else if (message.status !== "streaming") {
      events.push(event({ type: "message.completed", messageId: message.id }));
    }
  }
  return createRuntime(threadId, events);
}

export function createConversationFixtureRuntime(scenario: ConversationFixtureId): Runtime {
  switch (scenario) {
    case "empty":
      return runtimeFor("conversation-empty");
    case "streaming":
      return runtimeFor("conversation-streaming", [
        { id: "user-1", role: "user", text: "Summarize the component quality contract." },
        { id: "assistant-1", role: "assistant", text: "A component is release-ready when its hierarchy, interaction states, responsive behavior, accessibility, and visual baselines have all been reviewed", status: "streaming" },
      ]);
    case "interrupted":
      return runtimeFor("conversation-interrupted", [
        { id: "user-1", role: "user", text: "Draft a launch plan, but stop after the first stage." },
        { id: "assistant-1", role: "assistant", text: "Stage one: confirm the audience, core promise, and measurable activation event.", status: "interrupted", reason: "Stopped by the user. Partial response preserved." },
      ]);
    case "failed":
      return runtimeFor("conversation-failed", [
        { id: "user-1", role: "user", text: "Generate a migration checklist." },
        { id: "assistant-1", role: "assistant", text: "I started the checklist, but the connection ended before the final review steps.", status: "failed", reason: "Connection interrupted. Your partial response is preserved." },
      ]);
    case "long-content":
      return runtimeFor("conversation-long-content", [
        { id: "user-1", role: "user", text: "What should a robust response layout survive?" },
        { id: "assistant-1", role: "assistant", text: "A robust response survives long paragraphs without losing a readable measure. It keeps actions close to the content they affect and lets code overflow inside its own region rather than breaking the page.\n\nInstall: pnpm add @aifrontkit/react @aifrontkit/core @aifrontkit/tokens\n\nUnbroken-content-stress: registry_component_conversation_with_a_very_long_identifier_that_must_wrap_without_creating_page_level_horizontal_overflow." },
        { id: "user-2", role: "user", text: "And on narrow screens?" },
        { id: "assistant-2", role: "assistant", text: "The transcript keeps its rhythm, user messages remain visually distinct, controls retain touch-safe targets, and the composer stays reachable without covering the response." },
      ]);
    case "mixed-roles":
      return runtimeFor("conversation-mixed-roles", [
        { id: "system-1", role: "system", text: "Workspace context updated · three files selected" },
        { id: "user-1", role: "user", text: "Review the selected architecture notes." },
        { id: "assistant-1", role: "assistant", text: "The boundaries are clear. The remaining risk is duplicated presentation logic between the registry and documentation preview." },
      ]);
    case "rtl":
      return runtimeFor("conversation-rtl", [
        { id: "user-1", role: "user", text: "كيف نحافظ على وضوح واجهة المحادثة؟" },
        { id: "assistant-1", role: "assistant", text: "نستخدم ترتيبًا دلاليًا ثابتًا، ومسافات هادئة، وعناصر تحكم تحمل أسماء واضحة، مع الحفاظ على معنى الأيقونات الاتجاهية." },
      ]);
    case "localization":
      return runtimeFor("conversation-localization", [
        { id: "user-1", role: "user", text: "Beschreibe die Qualitätsanforderungen für eine produktionsreife Unterhaltungskomponente." },
        { id: "assistant-1", role: "assistant", text: "Die Komponente muss in allen unterstützten Darstellungen eine klare visuelle Hierarchie, nachvollziehbare Zustände, vollständig bedienbare Tastaturpfade und robuste Umbrüche für lange lokalisierte Inhalte bewahren." },
      ]);
    case "default":
    default:
      return runtimeFor("conversation-default", [
        { id: "user-1", role: "user", text: "How should I structure an AI chat interface?" },
        { id: "assistant-1", role: "assistant", text: "Start with a small behavior layer, then compose messages, tool states, and the prompt input as editable source. Keep transport outside the visual component so teams can change providers without rebuilding the interface." },
      ]);
  }
}

/** A self-contained, network-free rendering of the installable Conversation component. */
export function ConversationFixture({ scenario = "default", className }: ConversationFixtureProps) {
  const runtime = createConversationFixtureRuntime(scenario);
  const hasRecovery = scenario === "failed" || scenario === "interrupted";
  return (
    <AIFrontKitProvider runtime={runtime}>
      <Conversation
        presentation="full-height"
        {...(className ? { className } : {})}
        messageMotion="none"
        header={<div className="aifk-fixture-heading"><strong>Product review</strong><small>{runtime.getState().messageOrder.length} messages</small></div>}
        footer={<PromptInput onSubmit={() => undefined} placeholder="Ask a follow-up…" hint="Enter to send" />}
        renderMessage={(messageId) => (
          <Message
            messageId={messageId}
            motion="none"
            announceStatus={false}
            recovery={hasRecovery && messageId.startsWith("assistant") ? <button type="button">{scenario === "interrupted" ? "Continue" : "Try again"}</button> : undefined}
            actions={messageId.startsWith("assistant") ? <><button type="button">Copy response</button><button type="button">Try again</button></> : undefined}
          />
        )}
      />
    </AIFrontKitProvider>
  );
}
