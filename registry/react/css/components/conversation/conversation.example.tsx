import type { AIFrontEvent, ConversationStatus, Message as MessageModel, MessageStatus } from "@aifrontkit/core";
import { createRuntime } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import {
  definePlaygroundDefinition,
  type PlaygroundEnvironment,
  type PlaygroundRecord,
  type PlaygroundState,
} from "@aifrontkit/core/testing";
import type { ReactNode } from "react";
import { exampleEnvironmentControlsFor, exampleEnvironmentDefaults, quote } from "../../examples/shared.js";
import { Message } from "../message/message.js";
import { PromptInput } from "../prompt-input/prompt-input.js";
import { Conversation } from "./conversation.js";

type ConversationExampleScenario =
  | "default"
  | "empty"
  | "submitted"
  | "streaming"
  | "awaiting-approval"
  | "completed"
  | "interrupted"
  | "failed"
  | "long-content"
  | "mixed-roles"
  | "rtl"
  | "localization"
  | "runtime";

/** Serializable controls shared by the documentation playground and Component Lab. */
export interface ConversationExampleProps extends PlaygroundRecord {
  /** Controlled messages are the default; runtime lookup is an optional integration mode. */
  mode: "controlled" | "runtime";
  /** A documented transcript fixture. The generated source always contains its concrete values. */
  scenario: ConversationExampleScenario;
  presentation: "embedded" | "full-height" | "workspace";
  messageVariant: "minimal" | "conversation" | "dense" | "workspace";
  userMessage: string;
  assistantMessage: string;
  systemMessage: string;
  showSystemMessage: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showActions: boolean;
  showRecovery: boolean;
  placeholder: string;
  hint: string;
  emptyTitle: string;
  accessibleLabel: string;
  followOutput: boolean;
  followThreshold: number;
}

export type ConversationExampleState = PlaygroundState<ConversationExampleProps, PlaygroundEnvironment>;

export interface ConversationExampleRenderContext {
  emit(message: string): void;
}

const threadId = "conversation-example";
const version = "1.0.0";

const defaults: ConversationExampleState = {
  props: {
    mode: "controlled",
    scenario: "default",
    presentation: "full-height",
    messageVariant: "conversation",
    userMessage: "How should I structure an AI chat interface?",
    assistantMessage: "Start with a small behavior layer, then compose messages, tool states, and the prompt input as editable source. Keep transport outside the visual component so teams can change providers without rebuilding the interface.",
    systemMessage: "Workspace context updated · three files selected",
    showSystemMessage: false,
    showHeader: true,
    showFooter: true,
    showActions: true,
    showRecovery: true,
    placeholder: "Ask a follow-up…",
    hint: "Enter to send",
    emptyTitle: "No messages yet",
    accessibleLabel: "Conversation",
    followOutput: true,
    followThreshold: 48,
  },
  environment: { ...exampleEnvironmentDefaults },
};

function message(
  id: string,
  role: MessageModel["role"],
  status: MessageStatus,
  text: string,
  reason?: string,
): MessageModel {
  return {
    id,
    threadId,
    role,
    status,
    parts: text ? [{ id: "text:0", type: "text", text }] : [],
    createdAt: Number(id.replace(/\D/g, "")) || 1,
    ...(status === "complete" ? { completedAt: 2 } : {}),
    ...(status === "failed" ? { error: reason ?? "Connection interrupted. Your partial response is preserved." } : {}),
    ...(status === "interrupted" ? { interruptionReason: reason ?? "Stopped by the user. Partial response preserved." } : {}),
  };
}

function messagesFor(props: ConversationExampleProps): readonly MessageModel[] {
  switch (props.scenario) {
    case "empty":
      return [];
    case "submitted":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "pending", ""),
      ];
    case "streaming":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "streaming", "A component is release-ready when its hierarchy, interaction states, responsive behavior, accessibility, and visual baselines have all been reviewed"),
      ];
    case "awaiting-approval":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "The command is ready. Review the requested action before it runs."),
      ];
    case "completed":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "Yes. Its interaction, accessibility, responsive, and visual evidence are complete."),
      ];
    case "interrupted":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "interrupted", "Stage one: confirm the audience, core promise, and measurable activation event.", "Stopped by the user. Partial response preserved."),
      ];
    case "failed":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "failed", "I started the checklist, but the connection ended before the final review steps.", "Connection interrupted. Your partial response is preserved."),
      ];
    case "long-content":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "A robust response survives long paragraphs without losing a readable measure. It keeps actions close to the content they affect and lets code overflow inside its own region rather than breaking the page.\n\nInstall: pnpm add @aifrontkit/react @aifrontkit/core\n\nUnbroken-content-stress: registry_component_conversation_with_a_very_long_identifier_that_must_wrap_without_creating_page_level_horizontal_overflow."),
        message("user-2", "user", "complete", "And on narrow screens?"),
        message("assistant-2", "assistant", "complete", "The transcript keeps its rhythm, user messages remain visually distinct, controls retain touch-safe targets, and the composer stays reachable without covering the response."),
      ];
    case "mixed-roles":
      return [
        message("system-1", "system", "complete", props.systemMessage),
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "The boundaries are clear. The remaining risk is duplicated presentation logic between the registry and documentation preview."),
      ];
    case "rtl":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "نستخدم ترتيبًا دلاليًا ثابتًا، ومسافات هادئة، وعناصر تحكم تحمل أسماء واضحة، مع الحفاظ على معنى الأيقونات الاتجاهية."),
      ];
    case "localization":
      return [
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", "Die Komponente muss in allen unterstützten Darstellungen eine klare visuelle Hierarchie, nachvollziehbare Zustände, vollständig bedienbare Tastaturpfade und robuste Umbrüche für lange lokalisierte Inhalte bewahren."),
      ];
    case "runtime":
    case "default":
    default:
      return [
        ...(props.showSystemMessage ? [message("system-1", "system", "complete", props.systemMessage)] : []),
        message("user-1", "user", "complete", props.userMessage),
        message("assistant-1", "assistant", "complete", props.assistantMessage),
      ];
  }
}

function statusFor(props: ConversationExampleProps): ConversationStatus | undefined {
  return props.scenario === "awaiting-approval" ? "awaiting-approval" : undefined;
}

/** New runtime mode is event-driven; no deprecated message-array runtime helper is used. */
function runtimeFor(messages: readonly MessageModel[], scenario: ConversationExampleScenario) {
  let sequence = 0;
  const event = (input: Record<string, unknown>): AIFrontEvent => ({
    ...input,
    schemaVersion: 2,
    id: `${threadId}-event-${++sequence}`,
    threadId,
    timestamp: sequence,
  }) as AIFrontEvent;
  const events: AIFrontEvent[] = [];
  for (const item of messages) {
    events.push(event({ type: "message.started", messageId: item.id, role: item.role, parts: [...item.parts] }));
    if (item.status === "complete") events.push(event({ type: "message.completed", messageId: item.id }));
    if (item.status === "interrupted") events.push(event({ type: "message.interrupted", messageId: item.id, ...(item.interruptionReason ? { reason: item.interruptionReason } : {}) }));
    if (item.status === "failed") events.push(event({ type: "message.failed", messageId: item.id, error: item.error ?? "The response could not be completed." }));
  }
  if (scenario === "awaiting-approval") {
    events.push(event({
      type: "tool.updated",
      toolCallId: "tool-release-check",
      messageId: "assistant-1",
      partId: "tool:release-check",
      name: "run_release_check",
      status: "approval-requested",
      input: { command: "pnpm release:check" },
    }));
  }
  return { runtime: createRuntime(threadId, events), events };
}

function ActionButtons({ emit, messageId }: { emit(message: string): void; messageId: string }) {
  return <>
    <button type="button" onClick={() => emit(`onAction("copy", ${quote(messageId)})`)}>Copy response</button>
    <button type="button" onClick={() => emit(`onAction("retry", ${quote(messageId)})`)}>Try again</button>
  </>;
}

function ConversationPreview({ state, emit }: { state: ConversationExampleState; emit(message: string): void }) {
  const props = state.props;
  const messages = messagesFor(props);
  const runtime = props.mode === "runtime" ? runtimeFor(messages, props.scenario).runtime : null;
  const conversationStatus = statusFor(props);
  const conversation = (
    <Conversation
      {...(props.mode === "controlled" ? { messages } : {})}
      {...(conversationStatus === undefined ? {} : { status: conversationStatus })}
      presentation={props.presentation}
      messageVariant={props.messageVariant}
      messageMotion={state.environment.motion}
      label={props.accessibleLabel}
      viewportProps={{ followOutput: props.followOutput, followThreshold: props.followThreshold }}
      {...(props.showHeader ? { header: <div className="aifk-fixture-heading"><strong>Product review</strong><small> · {messages.length} messages</small></div> } : {})}
      {...(props.showFooter ? { footer: <PromptInput onSubmit={(value) => emit(`onSubmit(${quote(value)})`)} placeholder={props.placeholder} hint={props.hint} toolbarStart={<button type="button" aria-label="Add attachment" onClick={() => emit("onAttachmentOpen()")}>+</button>} /> } : {})}
      empty={<><strong>{props.emptyTitle}</strong><span>Write a prompt to begin.</span></>}
      renderMessage={(messageId, _index, currentMessage) => (
        <Message
          messageId={messageId}
          variant={props.messageVariant}
          motion={state.environment.motion}
          announceStatus={false}
          actions={props.showActions && currentMessage.role === "assistant" ? <ActionButtons emit={emit} messageId={messageId} /> : undefined}
          recovery={props.showRecovery && (currentMessage.status === "failed" || currentMessage.status === "interrupted") ? <button type="button" onClick={() => emit(`onRecover(${quote(messageId)})`)}>{currentMessage.status === "failed" ? "Try again" : "Continue"}</button> : undefined}
        />
      )}
    />
  );

  return runtime ? <AIFrontKitProvider runtime={runtime}>{conversation}</AIFrontKitProvider> : conversation;
}

function messageCode(messages: readonly MessageModel[], language: PlaygroundEnvironment["language"]) {
  const typed = language === "tsx";
  const typeAssertion = typed ? " as const" : "";
  const rows = messages.map((item) => [
    "  {",
    `    id: ${quote(item.id)},`,
    `    threadId: ${quote(threadId)},`,
    `    role: ${quote(item.role)}${typeAssertion},`,
    `    status: ${quote(item.status)}${typeAssertion},`,
    `    parts: ${JSON.stringify(item.parts)},`,
    `    createdAt: ${item.createdAt},`,
    item.completedAt === undefined ? "" : `    completedAt: ${item.completedAt},`,
    item.error ? `    error: ${quote(item.error)},` : "",
    item.interruptionReason ? `    interruptionReason: ${quote(item.interruptionReason)},` : "",
    "  },",
  ].filter(Boolean).join("\n"));
  return [`const messages${typed ? ": MessageModel[]" : ""} = [`, ...rows, "];"].join("\n");
}

function eventCode(messages: readonly MessageModel[], scenario: ConversationExampleScenario, language: PlaygroundEnvironment["language"]) {
  const { events } = runtimeFor(messages, scenario);
  const typed = language === "tsx";
  return [
    `const events${typed ? ": AIFrontEvent[]" : ""} = ${JSON.stringify(events, null, 2)};`,
    `const runtime = createRuntime(${quote(threadId)}, events);`,
  ].join("\n");
}

function generateConversationCode(state: ConversationExampleState): string {
  const props = state.props;
  const environment = state.environment;
  const messages = messagesFor(props);
  const typed = environment.language === "tsx";
  const imports = [
    '"use client";',
    "",
    `// AIFrontKit example · ${environment.framework} · ${environment.style} · ${environment.language}`,
    typed ? 'import type { AIFrontEvent, Message as MessageModel } from "@aifrontkit/core";' : "",
    props.mode === "runtime" ? 'import { createRuntime } from "@aifrontkit/core";' : "",
    props.mode === "runtime" ? 'import { AIFrontKitProvider } from "@aifrontkit/react";' : "",
    'import { Conversation } from "@/components/aifrontkit/conversation";',
    'import { Message } from "@/components/aifrontkit/message";',
    props.showFooter ? 'import { PromptInput } from "@/components/aifrontkit/prompt-input";' : "",
  ].filter(Boolean).join("\n");
  const conversationProps = [
    props.mode === "controlled" ? "      messages={messages}" : "",
    statusFor(props) ? `      status=${quote(statusFor(props)!)}` : "",
    `      presentation=${quote(props.presentation)}`,
    `      messageVariant=${quote(props.messageVariant)}`,
    `      messageMotion=${quote(environment.motion)}`,
    `      label=${quote(props.accessibleLabel)}`,
    `      viewportProps={{ followOutput: ${props.followOutput}, followThreshold: ${props.followThreshold} }}`,
    props.showHeader ? `      header={<div><strong>Product review</strong><small> · ${messages.length} messages</small></div>}` : "",
    props.showFooter ? `      footer={<PromptInput onSubmit={sendMessage} placeholder=${quote(props.placeholder)} hint=${quote(props.hint)} toolbarStart={<button type="button" aria-label="Add attachment" onClick={onAttachmentOpen}>+</button>} />}` : "",
    `      empty={<><strong>{${quote(props.emptyTitle)}}</strong><span>Write a prompt to begin.</span></>}`,
    "      renderMessage={(messageId, _index, message) => (",
    "        <Message",
    "          messageId={messageId}",
    `          variant=${quote(props.messageVariant)}`,
    `          motion=${quote(environment.motion)}`,
    "          announceStatus={false}",
    props.showActions ? '          actions={message.role === "assistant" ? <><button type="button" onClick={() => onAction("copy", messageId)}>Copy response</button><button type="button" onClick={() => onAction("retry", messageId)}>Try again</button></> : undefined}' : "",
    props.showRecovery ? '          recovery={message.status === "failed" || message.status === "interrupted" ? <button type="button" onClick={() => onRecover(messageId)}>{message.status === "failed" ? "Try again" : "Continue"}</button> : undefined}' : "",
    "        />",
    "      )}",
  ].filter(Boolean);
  const conversation = ["    <Conversation", ...conversationProps, "    />"].join("\n");
  const content = props.mode === "runtime"
    ? ["    <AIFrontKitProvider runtime={runtime}>", ...conversation.split("\n").map((line) => `  ${line}`), "    </AIFrontKitProvider>"].join("\n")
    : conversation;
  return [
    imports,
    "",
    props.mode === "controlled" ? messageCode(messages, environment.language) : eventCode(messages, props.scenario, environment.language),
    "",
    "export function ConversationExample() {",
    `  async function sendMessage(value${typed ? ": string" : ""}) {`,
    "    console.log(\"submit\", value);",
    "  }",
    `  const onAttachmentOpen${typed ? ": () => void" : ""} = () => console.log(\"attachment\");`,
    `  const onAction${typed ? ": (action: \"copy\" | \"retry\", messageId: string) => void" : ""} = (action, messageId) => console.log(action, messageId);`,
    `  const onRecover${typed ? ": (messageId: string) => void" : ""} = (messageId) => console.log(\"recover\", messageId);`,
    "",
    "  return (",
    `    <div dir=${quote(environment.direction)} data-aifk-theme=${quote(environment.theme)} data-aifk-motion=${quote(environment.motion)} style={{ height: 560 }}>`,
    content,
    "    </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

export const conversationExample = definePlaygroundDefinition<"conversation", ConversationExampleProps, PlaygroundEnvironment, ReactNode, ConversationExampleRenderContext>({
  id: "conversation",
  version,
  label: "Conversation",
  description: "Compose a controlled transcript first, then opt into an event-driven runtime without changing the visual composition.",
  defaults,
  scenarios: [
    { id: "default", version, label: "Default", description: "A completed two-message controlled conversation.", values: {}, testId: "conversation-default" },
    { id: "empty", version, label: "Empty", description: "First-use guidance with no transcript items.", values: { props: { scenario: "empty", showActions: false } }, testId: "conversation-empty" },
    { id: "submitted", version, label: "Submitted", description: "An accepted prompt before assistant output begins.", values: { props: { scenario: "submitted", userMessage: "Check the release readiness of this component.", showActions: false } }, testId: "conversation-submitted" },
    { id: "streaming", version, label: "Streaming", description: "Partial assistant output remains readable.", values: { props: { scenario: "streaming", userMessage: "Summarize the component quality contract." } }, testId: "conversation-streaming" },
    { id: "awaiting-approval", version, label: "Awaiting approval", description: "A pending decision pauses work without losing context.", values: { props: { scenario: "awaiting-approval", userMessage: "Run the release verification command." } }, testId: "conversation-awaiting-approval" },
    { id: "completed", version, label: "Completed", description: "Finished work returns to a quiet ready state.", values: { props: { scenario: "completed", userMessage: "Is the reference component ready for review?" } }, testId: "conversation-completed" },
    { id: "interrupted", version, label: "Interrupted", description: "Partial output and a continue action remain together.", values: { props: { scenario: "interrupted", userMessage: "Draft a launch plan, but stop after the first stage." } }, testId: "conversation-interrupted" },
    { id: "failed", version, label: "Failed", description: "An actionable failure retains partial content.", values: { props: { scenario: "failed", userMessage: "Generate a migration checklist." } }, testId: "conversation-failed" },
    { id: "long-content", version, label: "Long content", description: "Long prose, URLs, and unbroken values remain bounded.", values: { props: { scenario: "long-content", userMessage: "What should a robust response layout survive?" } }, testId: "conversation-long-content" },
    { id: "mixed-roles", version, label: "Mixed roles", description: "System, user, and assistant roles share one transcript.", values: { props: { scenario: "mixed-roles", userMessage: "Review the selected architecture notes.", showSystemMessage: true } }, testId: "conversation-mixed-roles" },
    { id: "rtl", version, label: "RTL", description: "Right-to-left content and control flow.", values: { props: { scenario: "rtl", userMessage: "كيف نحافظ على وضوح واجهة المحادثة؟" }, environment: { direction: "rtl" } }, testId: "conversation-rtl" },
    { id: "localization", version, label: "Localization", description: "Long translated content preserves its hierarchy.", values: { props: { scenario: "localization", userMessage: "Beschreibe die Qualitätsanforderungen für eine produktionsreife Unterhaltungskomponente." } }, testId: "conversation-localization" },
    { id: "runtime", version, label: "Runtime", description: "The same composition resolved from an optional event-driven runtime.", values: { props: { mode: "runtime", scenario: "runtime" } }, testId: "conversation-runtime" },
  ],
  controls: [
    { scope: "props", key: "userMessage", label: "User message", type: "textarea", group: "Content", visible: (state) => state.props.scenario === "default" || state.props.scenario === "runtime" },
    { scope: "props", key: "assistantMessage", label: "Assistant message", type: "textarea", group: "Content", visible: (state) => state.props.scenario === "default" || state.props.scenario === "runtime" },
    { scope: "props", key: "systemMessage", label: "System message", type: "text", group: "Content", visible: (state) => state.props.showSystemMessage || state.props.scenario === "mixed-roles" },
    { scope: "props", key: "placeholder", label: "Composer placeholder", type: "text", group: "Content", visible: (state) => state.props.showFooter },
    { scope: "props", key: "hint", label: "Composer hint", type: "text", group: "Content", visible: (state) => state.props.showFooter },
    { scope: "props", key: "emptyTitle", label: "Empty-state title", type: "text", group: "Content", visible: (state) => state.props.scenario === "empty" },
    { scope: "props", key: "presentation", label: "Presentation", type: "segmented", group: "Appearance", options: [{ label: "Embedded", value: "embedded" }, { label: "Full", value: "full-height" }, { label: "Workspace", value: "workspace" }] },
    { scope: "props", key: "messageVariant", label: "Message variant", type: "select", group: "Appearance", options: [{ label: "Minimal", value: "minimal" }, { label: "Conversation", value: "conversation" }, { label: "Dense", value: "dense" }, { label: "Workspace", value: "workspace" }] },
    { scope: "props", key: "scenario", label: "Runtime state", type: "select", group: "Behavior", options: [{ label: "Complete", value: "default" }, { label: "Empty", value: "empty" }, { label: "Submitted", value: "submitted" }, { label: "Streaming", value: "streaming" }, { label: "Awaiting approval", value: "awaiting-approval" }, { label: "Completed", value: "completed" }, { label: "Interrupted", value: "interrupted" }, { label: "Failed", value: "failed" }, { label: "Long content", value: "long-content" }, { label: "Mixed roles", value: "mixed-roles" }, { label: "RTL", value: "rtl" }, { label: "Localization", value: "localization" }, { label: "Runtime", value: "runtime" }] },
    { scope: "props", key: "followOutput", label: "Follow output", description: "Follow growth while the reader remains near the end.", type: "boolean", group: "Behavior" },
    { scope: "props", key: "followThreshold", label: "Follow threshold", type: "range", min: 0, max: 160, step: 8, unit: " px", group: "Behavior" },
    { scope: "props", key: "showHeader", label: "Header", description: "Show non-scrolling conversation context.", type: "boolean", group: "Slots" },
    { scope: "props", key: "showFooter", label: "Prompt input", description: "Show a non-scrolling composer.", type: "boolean", group: "Slots" },
    { scope: "props", key: "showActions", label: "Message actions", type: "boolean", group: "Slots" },
    { scope: "props", key: "showRecovery", label: "Recovery action", type: "boolean", group: "Slots" },
    { scope: "props", key: "showSystemMessage", label: "System message", type: "boolean", group: "Slots", visible: (state) => state.props.scenario === "default" || state.props.scenario === "runtime" },
    { scope: "props", key: "mode", label: "State ownership", description: "Controlled messages or an optional event-driven runtime.", type: "segmented", group: "Advanced", options: [{ label: "Controlled", value: "controlled" }, { label: "Runtime", value: "runtime" }] },
    { scope: "props", key: "accessibleLabel", label: "Accessible label", type: "text", group: "Advanced" },
    ...exampleEnvironmentControlsFor(defaults),
  ],
  render: (state, context) => <ConversationPreview state={state} emit={context.emit} />,
  generateCode: generateConversationCode,
});
