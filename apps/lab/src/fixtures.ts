import { createRuntime, type AIFrontEvent, type Runtime } from "@aifrontkit/core";
import { conversationQualityScenarios } from "../../../registry/components/conversation/conversation.quality.fixture.js";

export type FixtureId = (typeof conversationQualityScenarios)[number]["id"];

export interface Fixture {
  id: FixtureId;
  name: string;
  description: string;
  status: "Ready" | "Active" | "Stopped" | "Error" | "Stress";
  runtime: Runtime;
}

function eventFactory(threadId: string) {
  let sequence = 0;
  type MessageEventInput =
    | { type: "message.started"; messageId: string; role: "user" | "assistant" | "system" }
    | { type: "message.delta"; messageId: string; delta: string }
    | { type: "message.completed"; messageId: string }
    | { type: "message.interrupted"; messageId: string; reason?: string }
    | { type: "message.failed"; messageId: string; error: string };
  const make = (event: MessageEventInput): AIFrontEvent => ({
    ...event,
    schemaVersion: 1,
    id: `${threadId}-${++sequence}`,
    threadId,
    timestamp: sequence
  });
  return make;
}

function conversation(threadId: string, messages: Array<{ id: string; role: "user" | "assistant" | "system"; text: string; status?: "complete" | "streaming" | "interrupted" | "failed"; error?: string }>) {
  const event = eventFactory(threadId);
  const events: AIFrontEvent[] = [];
  for (const message of messages) {
    events.push(event({ type: "message.started", messageId: message.id, role: message.role }));
    if (message.text) events.push(event({ type: "message.delta", messageId: message.id, delta: message.text }));
    if (message.status === "failed") events.push(event({ type: "message.failed", messageId: message.id, error: message.error ?? "The response could not be completed." }));
    else if (message.status === "interrupted") events.push(event({ type: "message.interrupted", messageId: message.id, reason: message.error ?? "Stopped by the user. Partial response preserved." }));
    else if (message.status !== "streaming") events.push(event({ type: "message.completed", messageId: message.id }));
  }
  return createRuntime(threadId, events);
}

const fixtures: Fixture[] = [
  {
    id: "default",
    name: "Default",
    description: "A concise, completed exchange.",
    status: "Ready",
    runtime: conversation("fixture-default", [
      { id: "user-1", role: "user", text: "How should I structure an AI chat interface?" },
      { id: "assistant-1", role: "assistant", text: "Start with a small behavior layer, then compose messages, tool states, and the prompt input as editable source. Keep transport outside the visual component so teams can change providers without rebuilding the interface." }
    ])
  },
  {
    id: "empty",
    name: "Empty",
    description: "First-run state before a prompt is sent.",
    status: "Ready",
    runtime: createRuntime("fixture-empty")
  },
  {
    id: "streaming",
    name: "Streaming",
    description: "Partial response with an active status.",
    status: "Active",
    runtime: conversation("fixture-streaming", [
      { id: "user-1", role: "user", text: "Summarize the component quality contract." },
      { id: "assistant-1", role: "assistant", text: "A component is release-ready when its hierarchy, interaction states, responsive behavior, accessibility, and visual baselines have all been reviewed", status: "streaming" }
    ])
  },
  {
    id: "interrupted",
    name: "Interrupted",
    description: "Retained partial output after a deliberate stop.",
    status: "Stopped",
    runtime: conversation("fixture-interrupted", [
      { id: "user-1", role: "user", text: "Draft a launch plan, but stop after the first stage." },
      { id: "assistant-1", role: "assistant", text: "Stage one: confirm the audience, core promise, and measurable activation event.", status: "interrupted", error: "Stopped by the user. Partial response preserved." }
    ])
  },
  {
    id: "failed",
    name: "Failed",
    description: "Partial content with recovery affordance.",
    status: "Error",
    runtime: conversation("fixture-failed", [
      { id: "user-1", role: "user", text: "Generate a migration checklist." },
      { id: "assistant-1", role: "assistant", text: "I started the checklist, but the connection ended before the final review steps.", status: "failed", error: "Connection interrupted. Your partial response is preserved." }
    ])
  },
  {
    id: "long-content",
    name: "Long content",
    description: "Paragraphs, code, and unbroken text stress.",
    status: "Stress",
    runtime: conversation("fixture-long-content", [
      { id: "user-1", role: "user", text: "What should a robust response layout survive?" },
      { id: "assistant-1", role: "assistant", text: "A robust response survives long paragraphs without losing a readable measure. It keeps actions close to the content they affect and lets code overflow inside its own region rather than breaking the page.\n\nInstall: pnpm add @aifrontkit/react @aifrontkit/core @aifrontkit/tokens\n\nUnbroken-content-stress: registry_component_conversation_with_a_very_long_identifier_that_must_wrap_without_creating_page_level_horizontal_overflow." },
      { id: "user-2", role: "user", text: "And on narrow screens?" },
      { id: "assistant-2", role: "assistant", text: "The transcript keeps its rhythm, user messages remain visually distinct, controls retain touch-safe targets, and the composer stays reachable without covering the response." }
    ])
  },
  {
    id: "mixed-roles",
    name: "Mixed roles",
    description: "System, user, and assistant hierarchy.",
    status: "Stress",
    runtime: conversation("fixture-mixed-roles", [
      { id: "system-1", role: "system", text: "Workspace context updated · three files selected" },
      { id: "user-1", role: "user", text: "Review the selected architecture notes." },
      { id: "assistant-1", role: "assistant", text: "The boundaries are clear. The remaining risk is duplicated presentation logic between the registry and documentation preview." }
    ])
  },
  {
    id: "rtl",
    name: "Right to left",
    description: "Arabic transcript and mirrored composition.",
    status: "Stress",
    runtime: conversation("fixture-rtl", [
      { id: "user-1", role: "user", text: "كيف نحافظ على وضوح واجهة المحادثة؟" },
      { id: "assistant-1", role: "assistant", text: "نستخدم ترتيبًا دلاليًا ثابتًا، ومسافات هادئة، وعناصر تحكم تحمل أسماء واضحة، مع الحفاظ على معنى الأيقونات الاتجاهية." }
    ])
  },
  {
    id: "localization",
    name: "Localization",
    description: "Long translated labels and response content.",
    status: "Stress",
    runtime: conversation("fixture-localization", [
      { id: "user-1", role: "user", text: "Beschreibe die Qualitätsanforderungen für eine produktionsreife Unterhaltungskomponente." },
      { id: "assistant-1", role: "assistant", text: "Die Komponente muss in allen unterstützten Darstellungen eine klare visuelle Hierarchie, nachvollziehbare Zustände, vollständig bedienbare Tastaturpfade und robuste Umbrüche für lange lokalisierte Inhalte bewahren." }
    ])
  }
];

const fixtureIds = fixtures.map((fixture) => fixture.id);
const contractIds = conversationQualityScenarios.map((scenario) => scenario.id);
if (fixtureIds.join("|") !== contractIds.join("|")) throw new Error("Component Lab fixtures must match the Conversation quality contract in order and identity.");

export const fixtureMap = Object.fromEntries(fixtures.map((fixture) => [fixture.id, fixture])) as Record<FixtureId, Fixture>;
export const fixtureList = fixtures;
