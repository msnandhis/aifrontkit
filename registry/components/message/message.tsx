import React, { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { MessagePrimitive, type MessageRootProps } from "@aifrontkit/react/message";
import "./message.css";

export type MessageVariant = "minimal" | "conversation" | "dense" | "workspace";
export type MessageMotion = "none" | "subtle" | "expressive";

export interface MessageProps extends Omit<MessageRootProps, "children" | "className"> {
  variant?: MessageVariant;
  motion?: MessageMotion;
  className?: string;
  children?: ReactNode;
  actions?: ReactNode;
  metadata?: ReactNode;
  recovery?: ReactNode;
  avatar?: ReactNode;
  /** Disable when a parent Conversation provides the shared announcement. */
  announceStatus?: boolean;
  contentProps?: Omit<ComponentPropsWithoutRef<"div">, "children">;
}

/** A quiet, source-owned message presentation for normalized runtime state. */
export function Message({
  messageId,
  variant = "conversation",
  motion = "subtle",
  className,
  children,
  actions,
  metadata,
  recovery,
  avatar,
  announceStatus = true,
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
      <div className="aifk-message__body">
        {avatar ? <div className="aifk-message__avatar" aria-hidden="true">{avatar}</div> : null}
        <div className="aifk-message__main">
          <header className="aifk-message__header">
            <MessagePrimitive.Role className="aifk-message__role" />
            {metadata ? <div className="aifk-message__metadata">{metadata}</div> : null}
          </header>
          <MessagePrimitive.Content
            {...contentProps}
            className={["aifk-message__content", contentProps?.className].filter(Boolean).join(" ")}
          >
            {children}
          </MessagePrimitive.Content>
          <div className="aifk-message__state">
            <span className="aifk-message__streaming-indicator" aria-hidden="true"><i /><i /><i /></span>
            <MessagePrimitive.Error className="aifk-message__error" />
            {recovery ? <div className="aifk-message__recovery">{recovery}</div> : null}
          </div>
          {actions ? <footer className="aifk-message__actions">{actions}</footer> : null}
        </div>
      </div>
      <MessagePrimitive.Status announce={announceStatus} className="aifk-message__status aifk-message__sr-only" />
    </MessagePrimitive.Root>
  );
}
