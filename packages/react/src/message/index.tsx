import {
  createContext,
  Fragment,
  useContext,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode
} from "react";
import { resolveFileDownloadTarget, type ContentPart, type Message, type MessageRole, type MessageStatus } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

const MessageContext = createContext<Message | null>(null);

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
  const message = useRuntimeState((state) => state.messages[messageId]);
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

export type MessagePartRenderer<TPart extends ContentPart = ContentPart> = (props: MessagePartRendererProps<TPart>) => ReactNode;
export type MessagePartComponents = Partial<{ [Type in ContentPart["type"]]: MessagePartRenderer<Extract<ContentPart, { type: Type }>> }>;

export interface MessagePartsProps {
  components?: MessagePartComponents;
  renderPart?: MessagePartRenderer;
}

function defaultPart(part: ContentPart, index: number) {
  if (part.type === "text") return <span data-aifk-message-part="text" key={index}>{part.text}</span>;
  if (part.type === "image") return <img data-aifk-message-part="image" key={index} src={part.url} alt={part.alt ?? "Message attachment"} />;
  const target = resolveFileDownloadTarget(part);
  return target
    ? <a data-aifk-message-part="file" key={index} href={target} download={part.name}>{part.name}</a>
    : <span data-aifk-message-part="file" key={index}>{part.name}</span>;
}

function Parts({ components, renderPart }: MessagePartsProps) {
  const message = useMessage();
  return <>{message.parts.map((part, index) => {
    const renderer = components?.[part.type] as MessagePartRenderer | undefined;
    const output = renderPart?.({ part, message, index }) ?? renderer?.({ part, message, index }) ?? defaultPart(part, index);
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

export const MessagePrimitive = { Root, Content, Parts, Status, Role, Error: MessageError, Interruption: MessageInterruption, useMessage };
