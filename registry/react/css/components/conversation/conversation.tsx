"use client";

import React, { type ReactNode } from "react";
import type { Message as MessageModel } from "@aifrontkit/core";
import { useRuntimeState } from "@aifrontkit/react";
import { ConversationPrimitive, type ConversationRootProps, type ConversationViewportProps } from "@aifrontkit/react/conversation";
import { Message, type MessageMotion, type MessageVariant } from "../message/message.js";
import { PromptInput } from "../prompt-input/prompt-input.js";
import styles from "./conversation.module.css";

function slot(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

export type ConversationPresentation = "embedded" | "full-height" | "workspace";

export interface ConversationProps extends Omit<ConversationRootProps, "children" | "className" | "onSubmit"> {
  presentation?: ConversationPresentation;
  messageVariant?: MessageVariant;
  messageMotion?: MessageMotion;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
  /** Controlled mode. Omit to read messages from the nearest AIFrontKitProvider. */
  messages?: readonly MessageModel[];
  threadId?: string;
  /** Renders the default prompt input when no footer is supplied. */
  onSubmit?(value: string): void | Promise<void>;
  renderMessage?(messageId: string, index: number, message: MessageModel): ReactNode;
  viewportProps?: Omit<ConversationViewportProps, "children">;
}

type ConversationBodyProps = Omit<ConversationProps, "messages" | "threadId"> & {
  controlledMessages?: readonly MessageModel[];
  messagesById: Readonly<Record<string, MessageModel>>;
};

function ConversationBody({
  presentation = "embedded",
  messageVariant = "conversation",
  messageMotion = "subtle",
  className,
  header,
  footer,
  empty,
  renderMessage,
  viewportProps,
  onSubmit,
  controlledMessages,
  messagesById,
  ...props
}: ConversationBodyProps) {
  const resolvedFooter = footer ?? (onSubmit ? <PromptInput onSubmit={onSubmit} /> : null);
  return (
    <ConversationPrimitive.Root {...props} {...(controlledMessages ? { messages: controlledMessages } : {})} className={slot("aifk-conversation", className)} data-slot="conversation" data-presentation={presentation}>
      {header ? <header className={slot("aifk-conversation__header")} data-slot="conversation-header">{header}</header> : null}
      <ConversationPrimitive.Viewport {...viewportProps} className={slot("aifk-conversation__viewport", viewportProps?.className)} data-slot="conversation-viewport">
        <ConversationPrimitive.Empty className={slot("aifk-conversation__empty")} data-slot="conversation-empty">
          {empty ?? <><strong>No messages yet</strong><span>Send a prompt to begin this conversation.</span></>}
        </ConversationPrimitive.Empty>
        <ConversationPrimitive.List className={slot("aifk-conversation__list")} data-slot="conversation-list">
          <ConversationPrimitive.Items>
            {(messageId, index) => renderMessage?.(messageId, index, messagesById[messageId]!) ?? <Message messageId={messageId} variant={messageVariant} motion={messageMotion} announceStatus={false} />}
          </ConversationPrimitive.Items>
        </ConversationPrimitive.List>
      </ConversationPrimitive.Viewport>
      <ConversationPrimitive.ScrollToLatest className={slot("aifk-conversation__scroll-latest")} data-slot="conversation-scroll-to-latest">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v8m0 0 3-3m-3 3L5 8" /></svg>
        <span>Latest</span>
      </ConversationPrimitive.ScrollToLatest>
      <ConversationPrimitive.Status className={slot("aifk-conversation__sr-only")} />
      {resolvedFooter ? <footer className={slot("aifk-conversation__footer")} data-slot="conversation-footer">{resolvedFooter}</footer> : null}
    </ConversationPrimitive.Root>
  );
}

function ControlledConversation({ messages, threadId: _threadId, ...props }: ConversationProps & { messages: readonly MessageModel[] }) {
  const messagesById = Object.fromEntries(messages.map((message) => [message.id, message]));
  return <ConversationBody {...props} controlledMessages={messages} messagesById={messagesById} />;
}

function RuntimeConversation({ messages: _messages, threadId: _threadId, ...props }: ConversationProps) {
  const messagesById = useRuntimeState((state) => state.messages);
  return <ConversationBody {...props} messagesById={messagesById} />;
}

export function Conversation(props: ConversationProps) {
  return props.messages === undefined ? <RuntimeConversation {...props} /> : <ControlledConversation {...props} messages={props.messages} />;
}
