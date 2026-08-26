import {
  createContext,
  useContext,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode
} from "react";
import type { ContentPart, Message, MessageRole, MessageStatus } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

const MessageContext = createContext<Message | null>(null);

/** A message whose state is read from the nearest AIFrontKit runtime. */
export interface MessageRootProps extends ComponentPropsWithoutRef<"article"> {
  /** The normalized runtime message to present. */
  messageId: string;
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

function Root({ messageId, children, "aria-label": ariaLabel, ...props }: MessageRootProps) {
  const message = useRuntimeState((state) => state.messages[messageId]);
  if (!message) return null;

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

function renderPart(part: ContentPart, index: number) {
  if (part.type === "text") return <span data-aifk-message-part="text" key={index}>{part.text}</span>;
  if (part.type === "image") return <img data-aifk-message-part="image" key={index} src={part.url} alt={part.alt ?? "Message attachment"} />;
  return <a data-aifk-message-part="file" key={index} href={part.url} download={part.name}>{part.name}</a>;
}

function Content({ children, ...props }: MessageContentProps) {
  const message = useMessage();
  return <div {...props} data-aifk-message-content="">{children ?? message.parts.map(renderPart)}</div>;
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

export const MessagePrimitive = { Root, Content, Status, Role, Error: MessageError, Interruption: MessageInterruption, useMessage };
