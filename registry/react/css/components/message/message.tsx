"use client";

import React, { type ComponentPropsWithoutRef, type ReactNode } from "react";
import { MessagePrimitive, type MessagePartComponents, type MessagePartRenderer, type MessageRootProps } from "@aifrontkit/react/message";
import styles from "./message.module.css";
import { File } from "../file/file.js";

function slot(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

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
  partComponents?: MessagePartComponents;
  renderPart?: MessagePartRenderer;
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
  partComponents,
  renderPart,
  ...props
}: MessageProps) {
  return (
    <MessagePrimitive.Root
      {...props}
      {...(messageId ? { messageId } : {})}
      className={slot("aifk-message", className)}
      data-slot="message"
      data-variant={variant}
      data-motion={motion}
    >
      <div className={slot("aifk-message__body")} data-slot="message-body">
        {avatar ? <div className={slot("aifk-message__avatar")} data-slot="message-avatar" aria-hidden="true">{avatar}</div> : null}
        <div className={slot("aifk-message__main")} data-slot="message-main">
          <header className={slot("aifk-message__header")} data-slot="message-header">
            <MessagePrimitive.Role className={slot("aifk-message__role")} />
            {metadata ? <div className={slot("aifk-message__metadata")} data-slot="message-metadata">{metadata}</div> : null}
          </header>
          <MessagePrimitive.Content
            {...contentProps}
            className={slot("aifk-message__content", contentProps?.className)}
            data-slot="message-content"
          >
            {children ?? <MessagePrimitive.Parts components={{ file: ({ part }) => <File file={part} />, ...partComponents }} {...(renderPart ? { renderPart } : {})} />}
          </MessagePrimitive.Content>
          <div className={slot("aifk-message__state")} data-slot="message-state">
            <span className={slot("aifk-message__streaming-indicator")} aria-hidden="true"><i /><i /><i /></span>
            <MessagePrimitive.Interruption className={slot("aifk-message__interruption")} />
            <MessagePrimitive.Error className={slot("aifk-message__error")} />
            {recovery ? <div className={slot("aifk-message__recovery")} data-slot="message-recovery">{recovery}</div> : null}
          </div>
          {actions ? <footer className={slot("aifk-message__actions")} data-slot="message-actions">{actions}</footer> : null}
        </div>
      </div>
      <MessagePrimitive.Status announce={announceStatus} className={slot("aifk-message__status", styles["aifk-message__sr-only"], "aifk-message__sr-only")} />
    </MessagePrimitive.Root>
  );
}
