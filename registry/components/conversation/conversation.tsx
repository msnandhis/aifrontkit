import React, { type ReactNode } from "react";
import { ConversationPrimitive, type ConversationRootProps, type ConversationViewportProps } from "@aifrontkit/react/conversation";
import { Message, type MessageMotion, type MessageVariant } from "../message/message.js";
import "./conversation.css";

export type ConversationPresentation = "embedded" | "full-height" | "workspace";

export interface ConversationProps extends Omit<ConversationRootProps, "children" | "className"> {
  presentation?: ConversationPresentation;
  messageVariant?: MessageVariant;
  messageMotion?: MessageMotion;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  renderMessage?(messageId: string, index: number): ReactNode;
  viewportProps?: Omit<ConversationViewportProps, "children">;
}

export function Conversation({
  presentation = "embedded",
  messageVariant = "conversation",
  messageMotion = "subtle",
  className,
  header,
  footer,
  empty,
  renderMessage,
  viewportProps,
  ...props
}: ConversationProps) {
  return (
    <ConversationPrimitive.Root {...props} className={["aifk-conversation", className].filter(Boolean).join(" ")} data-presentation={presentation}>
      {header ? <header className="aifk-conversation__header">{header}</header> : null}
      <ConversationPrimitive.Viewport {...viewportProps} className={["aifk-conversation__viewport", viewportProps?.className].filter(Boolean).join(" ")}>
        <ConversationPrimitive.Empty className="aifk-conversation__empty">
          {empty ?? <><strong>No messages yet</strong><span>Send a prompt to begin this conversation.</span></>}
        </ConversationPrimitive.Empty>
        <ConversationPrimitive.List className="aifk-conversation__list">
          <ConversationPrimitive.Items>
            {(messageId, index) => renderMessage?.(messageId, index) ?? <Message messageId={messageId} variant={messageVariant} motion={messageMotion} announceStatus={false} />}
          </ConversationPrimitive.Items>
        </ConversationPrimitive.List>
      </ConversationPrimitive.Viewport>
      <ConversationPrimitive.ScrollToLatest className="aifk-conversation__scroll-latest">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v8m0 0 3-3m-3 3L5 8" /></svg>
        <span>Latest</span>
      </ConversationPrimitive.ScrollToLatest>
      <ConversationPrimitive.Status className="aifk-conversation__sr-only" />
      {footer ? <footer className="aifk-conversation__footer">{footer}</footer> : null}
    </ConversationPrimitive.Root>
  );
}
