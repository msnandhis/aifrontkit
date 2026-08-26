import type { Message as MessageModel, MessageStatus } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Conversation } from "../../../../../registry/react/css/components/conversation/conversation.js";
import { Message } from "../../../../../registry/react/css/components/message/message.js";
import { PromptInput } from "../../../../../registry/react/css/components/prompt-input/prompt-input.js";
import { definePlayground, type PlaygroundState } from "../types.js";
import { directionOptions, messageCode, messageModel, q, runtimeFrom } from "./shared.js";

interface ConversationState extends PlaygroundState {
  mode: "controlled" | "runtime";
  scenario: "default" | "empty" | "streaming" | "interrupted" | "failed" | "mixed-roles";
  presentation: "embedded" | "full-height" | "workspace";
  messageVariant: "minimal" | "conversation" | "dense" | "workspace";
  messageMotion: "none" | "subtle" | "expressive";
  userMessage: string;
  assistantMessage: string;
  showSystemMessage: boolean;
  systemMessage: string;
  showHeader: boolean;
  showFooter: boolean;
  showActions: boolean;
  showRecovery: boolean;
  placeholder: string;
  emptyTitle: string;
  accessibleLabel: string;
  followOutput: boolean;
  followThreshold: number;
  direction: "ltr" | "rtl";
}

const defaults: ConversationState = {
  mode: "controlled",
  scenario: "default",
  presentation: "full-height",
  messageVariant: "conversation",
  messageMotion: "subtle",
  userMessage: "How should I structure an AI chat interface?",
  assistantMessage: "Start with a small behavior layer, then compose messages and the prompt input as editable source.",
  showSystemMessage: false,
  systemMessage: "Workspace context updated · three files selected",
  showHeader: true,
  showFooter: true,
  showActions: true,
  showRecovery: true,
  placeholder: "Ask a follow-up…",
  emptyTitle: "No messages yet",
  accessibleLabel: "Conversation",
  followOutput: true,
  followThreshold: 48,
  direction: "ltr",
};

function messagesFor(state: ConversationState): MessageModel[] {
  if (state.scenario === "empty") return [];
  const status: MessageStatus = state.scenario === "streaming" || state.scenario === "interrupted" || state.scenario === "failed" ? state.scenario : "complete";
  const messages: MessageModel[] = [];
  if (state.showSystemMessage || state.scenario === "mixed-roles") messages.push(messageModel("system-1", "system", "complete", state.systemMessage));
  messages.push(messageModel("user-1", "user", "complete", state.userMessage));
  messages.push(messageModel("assistant-1", "assistant", status, state.assistantMessage));
  return messages;
}

function ActionButtons({ emit }: { emit(message: string): void }) {
  return <><button type="button" onClick={() => emit('onAction("copy", "assistant-1")')}>Copy response</button><button type="button" onClick={() => emit('onAction("retry", "assistant-1")')}>Try again</button></>;
}

function preview(state: ConversationState, emit: (message: string) => void) {
  const messages = messagesFor(state);
  const component = (
    <Conversation
      {...(state.mode === "controlled" ? { messages } : {})}
      presentation={state.presentation}
      messageVariant={state.messageVariant}
      messageMotion={state.messageMotion}
      label={state.accessibleLabel}
      viewportProps={{ followOutput: state.followOutput, followThreshold: state.followThreshold }}
      {...(state.showHeader ? { header: <div className="aifk-fixture-heading"><strong>Product review</strong><small>{messages.length} messages</small></div> } : {})}
      {...(state.showFooter ? { footer: <PromptInput onSubmit={(value) => emit("onSubmit(" + q(value) + ")")} placeholder={state.placeholder} /> } : {})}
      empty={<><strong>{state.emptyTitle}</strong><span>Write a prompt to begin.</span></>}
      {...(state.showActions || state.showRecovery ? { renderMessage: (messageId: string, _index: number, message: MessageModel) => (
        <Message
          messageId={messageId}
          variant={state.messageVariant}
          motion={state.messageMotion}
          announceStatus={false}
          actions={state.showActions && message.role === "assistant" ? <ActionButtons emit={emit} /> : undefined}
          recovery={state.showRecovery && (message.status === "failed" || message.status === "interrupted") ? <button type="button" onClick={() => emit("onRecover(" + q(message.id) + ")")}>{message.status === "failed" ? "Try again" : "Continue"}</button> : undefined}
        />
      ) } : {})}
    />
  );
  if (state.mode === "controlled") return component;
  return <AIFrontKitProvider runtime={runtimeFrom(messages)}>{component}</AIFrontKitProvider>;
}

function codeFor(state: ConversationState) {
  const messages = messagesFor(state);
  const imports = [
    "\"use client\";",
    "",
    "import type { Message as MessageModel } from \"@aifrontkit/core\";",
    state.mode === "runtime" ? "import { createRuntimeFromMessages } from \"@aifrontkit/core\";" : "",
    state.mode === "runtime" ? "import { AIFrontKitProvider } from \"@aifrontkit/react\";" : "",
    "import { Conversation } from \"@/components/aifrontkit/conversation\";",
    state.showActions || state.showRecovery ? "import { Message } from \"@/components/aifrontkit/message\";" : "",
  ].filter(Boolean).join("\n");
  const props = [
    state.mode === "controlled" ? "      messages={messages}" : "",
    "      presentation=" + q(state.presentation),
    "      messageVariant=" + q(state.messageVariant),
    "      messageMotion=" + q(state.messageMotion),
    "      label=" + q(state.accessibleLabel),
    "      viewportProps={{ followOutput: " + state.followOutput + ", followThreshold: " + state.followThreshold + " }}",
    state.showHeader ? "      header={<div><strong>Product review</strong><small>" + messages.length + " messages</small></div>}" : "",
    state.showFooter ? "      onSubmit={sendMessage}" : "",
    "      empty={<><strong>{" + q(state.emptyTitle) + "}</strong><span>Write a prompt to begin.</span></>}",
  ].filter(Boolean);
  if (state.showActions || state.showRecovery) {
    props.push(
      "      renderMessage={(messageId, _index, message) => (",
      "        <Message",
      "          messageId={messageId}",
      "          variant=" + q(state.messageVariant),
      "          motion=" + q(state.messageMotion),
      state.showActions ? '          actions={message.role === "assistant" ? <><button type="button">Copy response</button><button type="button">Try again</button></> : undefined}' : "",
      state.showRecovery ? '          recovery={message.status === "failed" ? <button>Try again</button> : undefined}' : "",
      "        />",
      "      )}"
    );
  }
  const conversation = ["    <Conversation", ...props.filter(Boolean), "    />"].join("\n");
  const wrapped = state.mode === "runtime"
    ? ["    <AIFrontKitProvider runtime={runtime}>", conversation.split("\n").map((line) => "  " + line).join("\n"), "    </AIFrontKitProvider>"].join("\n")
    : conversation;
  return [
    imports,
    "",
    messageCode(messages),
    state.mode === "runtime" ? '\nconst runtime = createRuntimeFromMessages("playground-thread", messages);' : "",
    "",
    "export function ConversationExample() {",
    "  async function sendMessage(value: string) {",
    '    console.log("submit", value);',
    "  }",
    "",
    "  return (",
    "  <div dir=" + q(state.direction) + " style={{ height: 560 }}>",
    wrapped,
    "  </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

export const conversationPlayground = definePlayground({
  id: "conversation",
  label: "Conversation",
  description: "Compose transcript behavior, message presentation, slots, content, and runtime ownership.",
  defaults,
  presets: [
    { id: "default", label: "Default", description: "A complete two-message controlled conversation.", values: {} },
    { id: "empty", label: "Empty", description: "First-use guidance with no messages.", values: { scenario: "empty", showActions: false } },
    { id: "streaming", label: "Streaming", description: "Partial assistant output remains readable.", values: { scenario: "streaming" } },
    { id: "interrupted", label: "Interrupted", description: "Partial output and a continue action remain together.", values: { scenario: "interrupted" } },
    { id: "failed", label: "Failed", description: "An actionable failure retains partial content.", values: { scenario: "failed" } },
    { id: "mixed-roles", label: "Mixed roles", description: "System, user, and assistant roles share one transcript.", values: { scenario: "mixed-roles", showSystemMessage: true } },
    { id: "workspace", label: "Workspace", description: "A denser presentation for artifact-oriented layouts.", values: { presentation: "workspace", messageVariant: "workspace" } },
    { id: "rtl", label: "RTL", description: "Right-to-left content and control flow.", values: { direction: "rtl", userMessage: "كيف نحافظ على وضوح واجهة المحادثة؟", assistantMessage: "نستخدم ترتيبًا دلاليًا ثابتًا ومسافات هادئة." } },
  ],
  controls: [
    { key: "userMessage", label: "User message", type: "textarea", group: "Content", visible: (state) => state.scenario !== "empty" },
    { key: "assistantMessage", label: "Assistant message", type: "textarea", group: "Content", visible: (state) => state.scenario !== "empty" },
    { key: "systemMessage", label: "System message", type: "text", group: "Content", visible: (state) => state.showSystemMessage || state.scenario === "mixed-roles" },
    { key: "placeholder", label: "Composer placeholder", type: "text", group: "Content", visible: (state) => state.showFooter },
    { key: "emptyTitle", label: "Empty-state title", type: "text", group: "Content", visible: (state) => state.scenario === "empty" },
    { key: "presentation", label: "Presentation", type: "segmented", group: "Appearance", options: [{ label: "Embedded", value: "embedded" }, { label: "Full", value: "full-height" }, { label: "Workspace", value: "workspace" }] },
    { key: "messageVariant", label: "Message variant", type: "select", group: "Appearance", options: [{ label: "Minimal", value: "minimal" }, { label: "Conversation", value: "conversation" }, { label: "Dense", value: "dense" }, { label: "Workspace", value: "workspace" }] },
    { key: "messageMotion", label: "Motion", type: "segmented", group: "Behavior", options: [{ label: "None", value: "none" }, { label: "Subtle", value: "subtle" }, { label: "Expressive", value: "expressive" }] },
    { key: "scenario", label: "Runtime state", type: "select", group: "Behavior", options: [{ label: "Complete", value: "default" }, { label: "Empty", value: "empty" }, { label: "Streaming", value: "streaming" }, { label: "Interrupted", value: "interrupted" }, { label: "Failed", value: "failed" }, { label: "Mixed roles", value: "mixed-roles" }] },
    { key: "followOutput", label: "Follow output", description: "Follow growth while the reader remains near the end.", type: "boolean", group: "Behavior" },
    { key: "followThreshold", label: "Follow threshold", type: "range", min: 0, max: 160, step: 8, unit: " px", group: "Behavior" },
    { key: "showHeader", label: "Header", description: "Show non-scrolling conversation context.", type: "boolean", group: "Slots" },
    { key: "showFooter", label: "Prompt input", description: "Show a non-scrolling composer.", type: "boolean", group: "Slots" },
    { key: "showActions", label: "Message actions", type: "boolean", group: "Slots" },
    { key: "showRecovery", label: "Recovery action", type: "boolean", group: "Slots" },
    { key: "showSystemMessage", label: "System message", type: "boolean", group: "Slots", visible: (state) => state.scenario !== "empty" },
    { key: "mode", label: "State ownership", description: "Controlled messages or the nearest runtime provider.", type: "segmented", group: "Advanced", options: [{ label: "Controlled", value: "controlled" }, { label: "Runtime", value: "runtime" }] },
    { key: "accessibleLabel", label: "Accessible label", type: "text", group: "Advanced" },
    { key: "direction", label: "Reading direction", type: "select", group: "Advanced", options: directionOptions },
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
