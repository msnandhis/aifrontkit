import {
  createContext,
  Fragment,
  useContext,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode
} from "react";
import { resolveFileDownloadTarget, type ContentPart, type Message, type MessageRole, type MessageStatus } from "@aifrontkit/core";
import { useMessageById } from "../runtime/index.js";

const MessageContext = createContext<Message | null>(null);
const RendererRegistryContext = createContext<MessageRendererRegistry | null>(null);

/** A message whose state is read from the nearest AIFrontKit runtime. */
export interface MessageRootProps extends ComponentPropsWithoutRef<"article"> {
  /** The normalized runtime message to present without a provider. */
  message?: Message;
  /** The normalized runtime message ID to read from the nearest provider. */
  messageId?: string;
}

export interface MessageContentProps extends ComponentPropsWithoutRef<"div"> {
  /** Replaces default normalized text, image, and file part rendering. */
  children?: ReactNode;
}

export interface MessageStatusProps extends ComponentPropsWithoutRef<"span"> {
  /** Keeps status accessible without announcing individual streamed tokens. */
  announce?: boolean;
}

export interface MessageRoleProps extends ComponentPropsWithoutRef<"span"> {
  /** Override the human-readable role label. */
  labels?: Partial<Record<MessageRole, string>>;
}

function messageLabel(role: MessageRole) {
  return role === "user" ? "User message" : role === "assistant" ? "Assistant message" : "System message";
}

function statusLabel(status: MessageStatus) {
  if (status === "streaming") return "Generating response";
  if (status === "interrupted") return "Response interrupted";
  if (status === "failed") return "Response failed";
  return "Response complete";
}

function useMessage() {
  const message = useContext(MessageContext);
  if (!message) throw new Error("MessagePrimitive components must be inside MessagePrimitive.Root.");
  return message;
}

type RootFrameProps = Omit<MessageRootProps, "message" | "messageId"> & { message: Message };

function RootFrame({ message, children, "aria-label": ariaLabel, ...props }: RootFrameProps) {
  return (
    <MessageContext.Provider value={message}>
      <article
        {...props}
        data-aifk-message=""
        data-role={message.role}
        data-status={message.status}
        aria-label={ariaLabel ?? messageLabel(message.role)}
        aria-busy={message.status === "streaming"}
      >
        {children}
      </article>
    </MessageContext.Provider>
  );
}

function RuntimeRoot({ messageId, ...props }: Omit<MessageRootProps, "message"> & { messageId: string }) {
  const message = useMessageById(messageId);
  if (!message) return null;
  return <RootFrame {...props} message={message} />;
}

function Root({ message, messageId, ...props }: MessageRootProps) {
  if (message) return <RootFrame {...props} message={message} />;
  if (messageId) return <RuntimeRoot {...props} messageId={messageId} />;
  throw new Error("MessagePrimitive.Root requires either `message` or `messageId`.");
}

export interface MessagePartRendererProps<TPart extends ContentPart = ContentPart> {
  part: TPart;
  message: Message;
  index: number;
}

/** `null` intentionally suppresses a part; `undefined` delegates to the next renderer. */
export type MessagePartRenderer<TPart extends ContentPart = ContentPart> = (props: MessagePartRendererProps<TPart>) => ReactNode | undefined;
export type MessagePartComponents = Partial<{ [Type in ContentPart["type"]]: MessagePartRenderer<Extract<ContentPart, { type: Type }>> }>;
export type MessagePartCategory = "text" | "media" | "attachment" | "source" | "reasoning" | "tool" | "data" | "custom";

export interface MessagePartsProps {
  /** Highest-precedence renderers for this Parts instance. */
  components?: MessagePartComponents;
  /** Highest-priority catch-all renderer for this Parts instance. */
  renderPart?: MessagePartRenderer;
  /** Per-tree renderer policy. Local props still take precedence. */
  registry?: MessageRendererRegistry;
}

export interface MessageRendererRegistry {
  /** Exact keys take precedence: `tool:weather`, `custom:chart`, then the raw type. */
  exact?: Readonly<Record<string, MessagePartRenderer | undefined>>;
  components?: MessagePartComponents;
  /** Category renderers run after exact renderers: e.g. media, tool, or custom. */
  categories?: Partial<Record<MessagePartCategory, MessagePartRenderer>>;
  /** Runs after exact and category renderers, before `unknown` and built-ins. */
  renderFallback?: MessagePartRenderer;
  /** Last application-owned chance to render a part before the neutral built-in. */
  unknown?: MessagePartRenderer;
}

export function MessageRendererProvider({ registry, children }: PropsWithChildren<{ registry: MessageRendererRegistry }>) {
  return <RendererRegistryContext.Provider value={registry}>{children}</RendererRegistryContext.Provider>;
}

function defaultPart(part: ContentPart, index: number) {
  if (part.type === "text") return <span data-aifk-message-part="text" key={index}>{part.text}</span>;
  if (part.type === "image") return <img data-aifk-message-part="image" key={index} src={part.url} alt={part.alt ?? "Message attachment"} />;
  if (part.type === "reasoning") return <span data-aifk-message-part="reasoning" key={index}>{part.visible === false ? part.summary ?? "Reasoning hidden" : part.text}</span>;
  if (part.type === "source") return part.url
    ? <a data-aifk-message-part="source" key={index} href={part.url}>{part.title ?? part.url}</a>
    : <span data-aifk-message-part="source" key={index}>{part.title ?? part.excerpt ?? "Source"}</span>;
  if (part.type === "tool") return <span data-aifk-message-part="tool" key={index}>{part.name}</span>;
  if (part.type === "data") return <pre data-aifk-message-part="data" key={index}>{JSON.stringify(part.data, null, 2)}</pre>;
  if (part.type === "file") {
    const target = resolveFileDownloadTarget(part);
    return target
      ? <a data-aifk-message-part="file" key={index} href={target} download={part.name}>{part.name}</a>
      : <span data-aifk-message-part="file" key={index}>{part.name}</span>;
  }
  return <span data-aifk-message-part={part.type} key={index}>{part.name ?? part.type}</span>;
}

function rendererKeys(part: ContentPart): readonly string[] {
  if (part.type === "tool") return [`tool:${part.name}`, "tool"];
  return [part.type];
}

function rendererCategory(part: ContentPart): MessagePartCategory {
  if (part.type === "text") return "text";
  if (part.type === "image") return "media";
  if (part.type === "file") return "attachment";
  if (part.type === "source") return "source";
  if (part.type === "reasoning") return "reasoning";
  if (part.type === "tool") return "tool";
  if (part.type === "data") return "data";
  return "custom";
}

function Parts({ components, renderPart, registry }: MessagePartsProps) {
  const message = useMessage();
  const inheritedRegistry = useContext(RendererRegistryContext);
  const activeRegistry = registry ?? inheritedRegistry;
  return <>{message.parts.map((part, index) => {
    const props = { part, message, index };
    const local = renderPart?.(props);
    const exact = components?.[part.type] as MessagePartRenderer | undefined;
    const localExact = local === undefined ? exact?.(props) : local;
    const registeredExact = rendererKeys(part).map((key) => activeRegistry?.exact?.[key]).find((renderer): renderer is MessagePartRenderer => Boolean(renderer));
    const registryByKey = localExact === undefined ? registeredExact?.(props) : localExact;
    const registeredType = activeRegistry?.components?.[part.type] as MessagePartRenderer | undefined;
    const registryByType = registryByKey === undefined ? registeredType?.(props) : registryByKey;
    const category = activeRegistry?.categories?.[rendererCategory(part)];
    const registryByCategory = registryByType === undefined ? category?.(props) : registryByType;
    const fallback = registryByCategory === undefined ? activeRegistry?.renderFallback?.(props) : registryByCategory;
    const unknown = fallback === undefined ? activeRegistry?.unknown?.(props) : fallback;
    // Null is an explicit, useful decision: do not fall through to a default.
    const output = unknown === undefined ? defaultPart(part, index) : unknown;
    return <Fragment key={`${part.type}-${index}`}>{output}</Fragment>;
  })}</>;
}

function Content({ children, ...props }: MessageContentProps) {
  return <div {...props} data-aifk-message-content="">{children ?? <Parts />}</div>;
}

function Status({ announce = true, ...props }: MessageStatusProps) {
  const message = useMessage();
  return (
    <span
      {...props}
      data-aifk-message-status={message.status}
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-atomic={announce ? "true" : undefined}
    >
      {statusLabel(message.status)}
    </span>
  );
}

function Role({ labels, ...props }: MessageRoleProps) {
  const message = useMessage();
  const label = labels?.[message.role] ?? (message.role === "user" ? "You" : message.role === "assistant" ? "Assistant" : "System");
  return <span {...props} data-aifk-message-role={message.role}>{label}</span>;
}

function MessageError({ children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"p">>) {
  const message = useMessage();
  if (message.status !== "failed") return null;
  return <p {...props} data-aifk-message-error="" role="alert">{children ?? message.error ?? "This response could not be completed."}</p>;
}

function MessageInterruption({ children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"p">>) {
  const message = useMessage();
  if (message.status !== "interrupted") return null;
  return <p {...props} data-aifk-message-interruption="">{children ?? message.interruptionReason ?? "Generation stopped. Partial response preserved."}</p>;
}

export const MessagePrimitive = { Root, Content, Parts, Status, Role, Error: MessageError, Interruption: MessageInterruption, RendererProvider: MessageRendererProvider, useMessage };
