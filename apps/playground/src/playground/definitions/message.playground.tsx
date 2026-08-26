import type { MessageRole, MessageStatus } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Message } from "../../../../../registry/react/css/components/message/message.js";
import { definePlayground, type PlaygroundState } from "../types.js";
import { directionOptions, messageCode, messageModel, q, runtimeFrom, statusOptions } from "./shared.js";

interface MessageState extends PlaygroundState {
  source: "message" | "runtime";
  role: MessageRole;
  status: MessageStatus;
  variant: "minimal" | "conversation" | "dense" | "workspace";
  motion: "none" | "subtle" | "expressive";
  text: string;
  showAvatar: boolean;
  showMetadata: boolean;
  showActions: boolean;
  showRecovery: boolean;
  announceStatus: boolean;
  direction: "ltr" | "rtl";
}

const defaults: MessageState = {
  source: "message",
  role: "assistant",
  status: "complete",
  variant: "conversation",
  motion: "subtle",
  text: "A good message keeps content readable and leaves application actions in explicit slots.",
  showAvatar: true,
  showMetadata: true,
  showActions: true,
  showRecovery: true,
  announceStatus: true,
  direction: "ltr",
};

function preview(state: MessageState, emit: (message: string) => void) {
  const message = messageModel("assistant-1", state.role, state.status, state.text);
  const component = (
    <Message
      {...(state.source === "message" ? { message } : { messageId: message.id })}
      variant={state.variant}
      motion={state.motion}
      announceStatus={state.announceStatus}
      avatar={state.showAvatar ? <span className="playground-avatar">AF</span> : undefined}
      metadata={state.showMetadata ? <span>Just now</span> : undefined}
      actions={state.showActions ? <><button type="button" onClick={() => emit('onAction("copy")')}>Copy response</button><button type="button" onClick={() => emit('onAction("retry")')}>Try again</button></> : undefined}
      recovery={state.showRecovery && (state.status === "failed" || state.status === "interrupted") ? <button type="button" onClick={() => emit('onRecover("assistant-1")')}>{state.status === "failed" ? "Try again" : "Continue"}</button> : undefined}
    />
  );
  return state.source === "message" ? component : <AIFrontKitProvider runtime={runtimeFrom([message])}>{component}</AIFrontKitProvider>;
}

function codeFor(state: MessageState) {
  const message = messageModel("assistant-1", state.role, state.status, state.text);
  const props = [
    state.source === "message" ? "    message={messages[0]}" : '    messageId="assistant-1"',
    "    variant=" + q(state.variant),
    "    motion=" + q(state.motion),
    state.showAvatar ? '    avatar={<span aria-hidden="true">AF</span>}' : "",
    state.showMetadata ? "    metadata={<span>Just now</span>}" : "",
    state.showActions ? '    actions={<><button type="button">Copy response</button><button type="button">Try again</button></>}' : "",
    state.showRecovery && (state.status === "failed" || state.status === "interrupted") ? "    recovery={<button>" + (state.status === "failed" ? "Try again" : "Continue") + "</button>}" : "",
    state.announceStatus ? "    announceStatus" : "    announceStatus={false}",
  ].filter(Boolean);
  return [
    "import type { Message as MessageModel } from \"@aifrontkit/core\";",
    state.source === "runtime" ? "import { createRuntimeFromMessages } from \"@aifrontkit/core\";" : "",
    state.source === "runtime" ? "import { AIFrontKitProvider } from \"@aifrontkit/react\";" : "",
    "import { Message } from \"@/components/aifrontkit/message\";",
    "",
    messageCode([message]),
    state.source === "runtime" ? '\nconst runtime = createRuntimeFromMessages("playground-thread", messages);' : "",
    "",
    "export function MessageExample() {",
    "  return (",
    "  <div dir=" + q(state.direction) + ">",
    state.source === "runtime" ? "  <AIFrontKitProvider runtime={runtime}>" : "",
    "  <Message",
    ...props,
    "  />",
    state.source === "runtime" ? "  </AIFrontKitProvider>" : "",
    "  </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

export const messagePlayground = definePlayground({
  id: "message",
  label: "Message",
  description: "Inspect role, lifecycle, presentation, motion, announcement, and optional visual slots.",
  defaults,
  presets: [
    { id: "default", label: "Assistant", description: "A completed assistant response with useful actions.", values: {} },
    { id: "user", label: "User", description: "A compact user-authored turn.", values: { role: "user", showAvatar: false, showMetadata: false, text: "Keep the user message distinct and easy to scan." } },
    { id: "system", label: "System", description: "Low-emphasis workspace context.", values: { role: "system", variant: "minimal", showAvatar: false, showActions: false, text: "Workspace context updated · three files selected" } },
    { id: "streaming", label: "Streaming", description: "Partial output with restrained progress feedback.", values: { status: "streaming" } },
    { id: "interrupted", label: "Interrupted", description: "Partial output remains with its continue action.", values: { status: "interrupted" } },
    { id: "failed", label: "Failed", description: "Failure meaning and retry remain attached.", values: { status: "failed" } },
    { id: "without-slots", label: "Without slots", description: "Optional regions collapse without gaps.", values: { showAvatar: false, showMetadata: false, showActions: false, showRecovery: false } },
    { id: "rtl", label: "RTL", description: "Right-to-left message content.", values: { direction: "rtl", text: "نحافظ على ترتيب دلالي واضح ومسافات هادئة." } },
  ],
  controls: [
    { key: "text", label: "Message text", type: "textarea", group: "Content" },
    { key: "role", label: "Role", type: "segmented", group: "Content", options: [{ label: "Assistant", value: "assistant" }, { label: "User", value: "user" }, { label: "System", value: "system" }] },
    { key: "variant", label: "Variant", type: "select", group: "Appearance", options: [{ label: "Minimal", value: "minimal" }, { label: "Conversation", value: "conversation" }, { label: "Dense", value: "dense" }, { label: "Workspace", value: "workspace" }] },
    { key: "motion", label: "Motion", type: "segmented", group: "Appearance", options: [{ label: "None", value: "none" }, { label: "Subtle", value: "subtle" }, { label: "Expressive", value: "expressive" }] },
    { key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: statusOptions },
    { key: "announceStatus", label: "Announce status", description: "Disable when Conversation owns the shared announcement.", type: "boolean", group: "Behavior" },
    { key: "showAvatar", label: "Avatar", type: "boolean", group: "Slots" },
    { key: "showMetadata", label: "Metadata", type: "boolean", group: "Slots" },
    { key: "showActions", label: "Actions", type: "boolean", group: "Slots" },
    { key: "showRecovery", label: "Recovery", type: "boolean", group: "Slots", visible: (state) => state.status === "failed" || state.status === "interrupted" },
    { key: "source", label: "State source", type: "segmented", group: "Advanced", options: [{ label: "Message prop", value: "message" }, { label: "Runtime ID", value: "runtime" }] },
    { key: "direction", label: "Reading direction", type: "select", group: "Advanced", options: directionOptions },
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
