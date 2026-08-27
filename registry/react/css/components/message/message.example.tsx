import type { Message as MessageModel, MessageRole, MessageStatus } from "@aifrontkit/core";
import { createRuntimeFromMessages } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import {
  definePlaygroundDefinition,
  type PlaygroundEnvironment,
  type PlaygroundRecord,
  type PlaygroundState,
} from "@aifrontkit/testing";
import type { ReactNode } from "react";
import { exampleEnvironmentControlsFor, exampleEnvironmentDefaults, quote } from "../../examples/shared.js";
import { Message } from "./message.js";

/** Serializable controls shared by the docs playground and the Component Lab. */
export interface MessageExampleProps extends PlaygroundRecord {
  source: "message" | "runtime";
  role: MessageRole;
  status: MessageStatus;
  variant: "minimal" | "conversation" | "dense" | "workspace";
  text: string;
  showAvatar: boolean;
  showMetadata: boolean;
  showActions: boolean;
  showRecovery: boolean;
  announceStatus: boolean;
}

export type MessageExampleState = PlaygroundState<MessageExampleProps, PlaygroundEnvironment>;

export interface MessageExampleRenderContext {
  emit(message: string): void;
}

const defaults: MessageExampleState = {
  props: {
    source: "message",
    role: "assistant",
    status: "complete",
    variant: "conversation",
    text: "A good message keeps content readable and leaves application actions in explicit slots.",
    showAvatar: true,
    showMetadata: true,
    showActions: true,
    showRecovery: true,
    announceStatus: true,
  },
  environment: { ...exampleEnvironmentDefaults },
};

function messageModel(
  id: string,
  role: MessageRole,
  status: MessageStatus,
  text: string,
  reason?: string,
): MessageModel {
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

function renderMessage(state: MessageExampleState, emit: (message: string) => void): ReactNode {
  const props = state.props;
  const message = messageModel("assistant-1", props.role, props.status, props.text);
  const component = (
    <Message
      {...(props.source === "message" ? { message } : { messageId: message.id })}
      variant={props.variant}
      motion={state.environment.motion}
      announceStatus={props.announceStatus}
      avatar={props.showAvatar ? <span aria-hidden="true">AF</span> : undefined}
      metadata={props.showMetadata ? <span>Just now</span> : undefined}
      actions={props.showActions ? <><button type="button" onClick={() => emit('onAction("copy")')}>Copy response</button><button type="button" onClick={() => emit('onAction("retry")')}>Try again</button></> : undefined}
      recovery={props.showRecovery && (props.status === "failed" || props.status === "interrupted") ? <button type="button" onClick={() => emit('onRecover("assistant-1")')}>{props.status === "failed" ? "Try again" : "Continue"}</button> : undefined}
    />
  );

  if (props.source === "message") return component;
  return <AIFrontKitProvider runtime={createRuntimeFromMessages("playground-thread", [message])}>{component}</AIFrontKitProvider>;
}

function generateMessageCode(state: MessageExampleState): string {
  const props = state.props;
  const environment = state.environment;
  const message = messageModel("assistant-1", props.role, props.status, props.text);
  const typed = environment.language === "tsx";
  const typeAssertion = environment.language === "tsx" ? " as const" : "";
  const componentProps = [
    props.source === "message" ? "    message={messages[0]}" : '    messageId="assistant-1"',
    "    variant=" + quote(props.variant),
    "    motion=" + quote(environment.motion),
    props.showAvatar ? '    avatar={<span aria-hidden="true">AF</span>}' : "",
    props.showMetadata ? "    metadata={<span>Just now</span>}" : "",
    props.showActions ? '    actions={<><button type="button" onClick={() => onAction("copy")}>Copy response</button><button type="button" onClick={() => onAction("retry")}>Try again</button></>}' : "",
    props.showRecovery && (props.status === "failed" || props.status === "interrupted") ? '    recovery={<button type="button" onClick={() => onRecover("assistant-1")}>' + (props.status === "failed" ? "Try again" : "Continue") + "</button>}" : "",
    props.announceStatus ? "    announceStatus" : "    announceStatus={false}",
  ].filter(Boolean);
  const messageRows = [
    "const messages" + (typed ? ": MessageModel[]" : "") + " = [",
    "  {",
    "    id: " + quote(message.id) + ",",
    "    threadId: " + quote(message.threadId) + ",",
    "    role: " + quote(message.role) + typeAssertion + ",",
    "    status: " + quote(message.status) + typeAssertion + ",",
    "    parts: [{ type: \"text\"" + typeAssertion + ", text: " + quote(props.text) + " }],",
    "    createdAt: 1,",
    message.completedAt === undefined ? "" : "    completedAt: 2,",
    message.error ? "    error: " + quote(message.error) + "," : "",
    message.interruptionReason ? "    interruptionReason: " + quote(message.interruptionReason) + "," : "",
    "  },",
    "];",
  ].filter((line) => line !== "").join("\n");
  const runtimeLines = props.source === "runtime"
    ? ["", 'const runtime = createRuntimeFromMessages("playground-thread", messages);']
    : [];
  return [
    "// AIFrontKit example · " + environment.framework + " · " + environment.style + " · " + environment.language,
    typed ? "import type { Message as MessageModel } from \"@aifrontkit/core\";" : "",
    props.source === "runtime" ? "import { createRuntimeFromMessages } from \"@aifrontkit/core\";" : "",
    props.source === "runtime" ? "import { AIFrontKitProvider } from \"@aifrontkit/react\";" : "",
    "import { Message } from \"@/components/aifrontkit/message\";",
    "",
    messageRows,
    ...runtimeLines,
    "",
    typed ? 'interface MessageExampleProps { onAction?(action: "copy" | "retry"): void; onRecover?(messageId: string): void; }' : "",
    "",
    "export function MessageExample({ onAction = () => undefined, onRecover = () => undefined }" + (typed ? ": MessageExampleProps" : "") + ") {",
    "  return (",
    "    <div dir=" + quote(environment.direction) + " data-aifk-theme=" + quote(environment.theme) + " data-aifk-motion=" + quote(environment.motion) + ">",
    props.source === "runtime" ? "      <AIFrontKitProvider runtime={runtime}>" : "",
    "      <Message",
    ...componentProps,
    "      />",
    props.source === "runtime" ? "      </AIFrontKitProvider>" : "",
    "    </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

const version = "1.0.0";

export const messageExample = definePlaygroundDefinition<"message", MessageExampleProps, PlaygroundEnvironment, ReactNode, MessageExampleRenderContext>({
  id: "message",
  version,
  label: "Message",
  description: "Inspect role, lifecycle, presentation, motion, announcement, and optional visual slots.",
  defaults,
  scenarios: [
    { id: "default", version, label: "Assistant", description: "A completed assistant response with useful actions.", values: {}, testId: "message-default" },
    { id: "streaming", version, label: "Streaming", description: "Partial output with restrained progress feedback.", values: { props: { status: "streaming" } }, testId: "message-streaming" },
    { id: "interrupted", version, label: "Interrupted", description: "Partial output remains with its continue action.", values: { props: { status: "interrupted" } }, testId: "message-interrupted" },
    { id: "failed", version, label: "Failed", description: "Failure meaning and retry remain attached.", values: { props: { status: "failed" } }, testId: "message-failed" },
    { id: "long-content", version, label: "Long content", description: "Long prose, links, and identifiers remain bounded.", values: { props: { text: "A readable message keeps prose at a useful measure and lets long values wrap without breaking its container.\n\nhttps://aifrontkit.dev/docs/components/message/quality/fixtures/long-content\n\nUnbroken-message-content_identifier_that_must_wrap_without_horizontal_page_overflow." } }, testId: "message-long-content" },
    { id: "user-role", version, label: "User", description: "A compact user-authored turn.", values: { props: { role: "user", showAvatar: false, showMetadata: false, text: "Keep the user message distinct and easy to scan." } }, testId: "message-user-role" },
    { id: "system-role", version, label: "System", description: "Low-emphasis workspace context.", values: { props: { role: "system", variant: "minimal", showAvatar: false, showActions: false, text: "Workspace context updated · three files selected" } }, testId: "message-system-role" },
    { id: "without-slots", version, label: "Without slots", description: "Optional regions collapse without gaps.", values: { props: { showAvatar: false, showMetadata: false, showActions: false, showRecovery: false } }, testId: "message-without-slots" },
    { id: "rtl", version, label: "RTL", description: "Right-to-left message content.", values: { props: { text: "نحافظ على ترتيب دلالي واضح ومسافات هادئة.", }, environment: { direction: "rtl" } }, testId: "message-rtl" },
    { id: "runtime", version, label: "Runtime ID", description: "The same presentation resolved by an optional runtime provider.", values: { props: { source: "runtime" } }, testId: "message-runtime" },
  ],
  controls: [
    { scope: "props", key: "text", label: "Message text", type: "textarea", group: "Content" },
    { scope: "props", key: "role", label: "Role", type: "segmented", group: "Content", options: [{ label: "Assistant", value: "assistant" }, { label: "User", value: "user" }, { label: "System", value: "system" }] },
    { scope: "props", key: "variant", label: "Variant", type: "select", group: "Appearance", options: [{ label: "Minimal", value: "minimal" }, { label: "Conversation", value: "conversation" }, { label: "Dense", value: "dense" }, { label: "Workspace", value: "workspace" }] },
    { scope: "props", key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: [{ label: "Complete", value: "complete" }, { label: "Streaming", value: "streaming" }, { label: "Interrupted", value: "interrupted" }, { label: "Failed", value: "failed" }] },
    { scope: "props", key: "announceStatus", label: "Announce status", description: "Disable when Conversation owns the shared announcement.", type: "boolean", group: "Behavior" },
    { scope: "props", key: "showAvatar", label: "Avatar", type: "boolean", group: "Slots" },
    { scope: "props", key: "showMetadata", label: "Metadata", type: "boolean", group: "Slots" },
    { scope: "props", key: "showActions", label: "Actions", type: "boolean", group: "Slots" },
    { scope: "props", key: "showRecovery", label: "Recovery", type: "boolean", group: "Slots", visible: (state) => state.props.status === "failed" || state.props.status === "interrupted" },
    { scope: "props", key: "source", label: "State source", type: "segmented", group: "Advanced", options: [{ label: "Message prop", value: "message" }, { label: "Runtime ID", value: "runtime" }] },
    ...exampleEnvironmentControlsFor(defaults),
  ],
  render: (state, context) => renderMessage(state, context.emit),
  generateCode: generateMessageCode,
});
