import React, { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { MessagePrimitive, type MessageRootProps } from "@aifrontkit/react/message";
import "./message.css";

export type MessageVariant = "minimal" | "conversation" | "dense" | "workspace";
export type MessageMotion = "none" | "subtle" | "expressive";

export interface MessageProps extends Omit<MessageRootProps, "children" | "className"> {
  /** A layout treatment; state and accessibility semantics stay identical. */
  variant?: MessageVariant;
  /** Controls entrance motion. `none` is useful in dense or user-controlled contexts. */
  motion?: MessageMotion;
  className?: string;
  /** Supply a Markdown renderer or other custom content in place of default parts. */
  children?: ReactNode;
  contentProps?: Omit<ComponentPropsWithoutRef<"div">, "children">;
}

/**
 * A deliberately neutral, source-owned presentation for a runtime message.
 * Edit this file and message.css after installation to match the host product.
 */
export function Message({
  messageId,
  variant = "conversation",
  motion = "subtle",
  className,
  children,
  contentProps,
  ...props
}: MessageProps) {
  return (
    <MessagePrimitive.Root
      {...props}
      messageId={messageId}
      className={["aifk-message", className].filter(Boolean).join(" ")}
      data-variant={variant}
      data-motion={motion}
    >
      <header className="aifk-message__header">
        <MessagePrimitive.Role className="aifk-message__role" />
        <span className="aifk-message__streaming-indicator" aria-hidden="true" />
      </header>
      <MessagePrimitive.Content {...contentProps} className={["aifk-message__content", contentProps?.className].filter(Boolean).join(" ")}>
        {children}
      </MessagePrimitive.Content>
      <MessagePrimitive.Error className="aifk-message__error" />
      <MessagePrimitive.Status className="aifk-message__status aifk-message__sr-only" />
    </MessagePrimitive.Root>
  );
}
