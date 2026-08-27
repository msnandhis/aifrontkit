import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ReactNode,
  type Ref
} from "react";
import { getConversationStatus, type ConversationStatus, type Message } from "@aifrontkit/core";
import { ControlledMessagesProvider, useAIFrontKitRuntime, useRuntimeState } from "../runtime/index.js";

interface ConversationContextValue {
  messageIds: readonly string[];
  empty: boolean;
  streaming: boolean;
  activity: ConversationStatus;
  atEnd: boolean;
  setAtEnd(value: boolean): void;
  viewport: HTMLDivElement | null;
  setViewport(value: HTMLDivElement | null): void;
}

const ConversationContext = createContext<ConversationContextValue | null>(null);

function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) throw new Error("ConversationPrimitive components must be inside ConversationPrimitive.Root.");
  return context;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export interface ConversationRootProps extends ComponentPropsWithoutRef<"section"> {
  /** Accessible label for the transcript region. */
  label?: string;
  /**
   * Controlled-first transcript data. Passing it never creates a runtime or
   * provider; child MessagePrimitive roots resolve these exact values.
   */
  messages?: readonly Message[];
  /** Override derived transcript lifecycle when the host owns that state. */
  status?: ConversationStatus;
}

interface ConversationFrameProps extends Omit<ConversationRootProps, "messages" | "status"> {
  messageIds: readonly string[];
  activity: ConversationStatus;
}

function RootFrame({ label = "Conversation", children, "aria-label": ariaLabel, messageIds, activity, ...props }: ConversationFrameProps) {
  const streaming = activity === "streaming";
  const [atEnd, setAtEnd] = useState(true);
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null);
  const empty = messageIds.length === 0;

  return (
    <ConversationContext.Provider value={{ messageIds, empty, streaming, activity, atEnd, setAtEnd, viewport, setViewport }}>
      <section
        {...props}
        data-aifk-conversation=""
        data-empty={empty ? "true" : "false"}
        data-streaming={streaming ? "true" : "false"}
        aria-label={ariaLabel ?? label}
      >
        {children}
      </section>
    </ConversationContext.Provider>
  );
}

function RuntimeRoot({ messages: _messages, status, ...props }: ConversationRootProps) {
  // Reading the runtime inside this branch preserves the provider-only API.
  useAIFrontKitRuntime();
  const messageIds = useRuntimeState((state) => state.messageOrder);
  const activity = useRuntimeState((state) => getConversationStatus(state));
  return <RootFrame {...props} messageIds={messageIds} activity={status ?? activity} />;
}

function ControlledRoot({ messages = [], status, ...props }: ConversationRootProps & { messages: readonly Message[] }) {
  const activity = status ?? getConversationStatus({
    messageOrder: messages.map((message) => message.id),
    messages: Object.fromEntries(messages.map((message) => [message.id, message]))
  });
  return (
    <ControlledMessagesProvider messages={messages}>
      <RootFrame {...props} messageIds={messages.map((message) => message.id)} activity={activity} />
    </ControlledMessagesProvider>
  );
}

function Root(props: ConversationRootProps) {
  return props.messages === undefined ? <RuntimeRoot {...props} /> : <ControlledRoot {...props} messages={props.messages} />;
}

export interface ConversationViewportProps extends ComponentPropsWithoutRef<"div"> {
  /** Distance from the bottom that still counts as following output. */
  followThreshold?: number;
  /** Follow content growth only while the reader remains near the bottom. */
  followOutput?: boolean;
}

const Viewport = forwardRef<HTMLDivElement, ConversationViewportProps>(function ConversationViewport(
  { followThreshold = 48, followOutput = true, onScroll, children, ...props },
  forwardedRef
) {
  const { atEnd, setAtEnd, setViewport } = useConversation();
  const localRef = useRef<HTMLDivElement | null>(null);
  const atEndRef = useRef(atEnd);
  atEndRef.current = atEnd;

  const updatePosition = useCallback((element: HTMLDivElement) => {
    const distance = element.scrollHeight - element.scrollTop - element.clientHeight;
    setAtEnd(distance <= followThreshold);
  }, [followThreshold, setAtEnd]);

  const setRefs = useCallback((element: HTMLDivElement | null) => {
    localRef.current = element;
    setViewport(element);
    assignRef(forwardedRef, element);
  }, [forwardedRef, setViewport]);

  useEffect(() => {
    const element = localRef.current;
    if (!element || !followOutput || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      if (atEndRef.current) element.scrollTo({ top: element.scrollHeight, behavior: "auto" });
      updatePosition(element);
    });
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [followOutput, updatePosition]);

  return (
    <div
      {...props}
      ref={setRefs}
      data-aifk-conversation-viewport=""
      data-at-end={atEnd ? "true" : "false"}
      onScroll={(event) => {
        updatePosition(event.currentTarget);
        onScroll?.(event);
      }}
    >
      {children}
    </div>
  );
});

function List({ children, ...props }: ComponentPropsWithoutRef<"ol">) {
  const { empty } = useConversation();
  if (empty) return null;
  return <ol {...props} data-aifk-conversation-list="" role="list">{children}</ol>;
}

export interface ConversationItemsProps {
  children(messageId: string, index: number): ReactNode;
}

function Items({ children }: ConversationItemsProps) {
  const { messageIds } = useConversation();
  return <>{messageIds.map((messageId, index) => <li data-aifk-conversation-item="" key={messageId}>{children(messageId, index)}</li>)}</>;
}

function Empty({ children = "Start a conversation.", ...props }: ComponentPropsWithoutRef<"div">) {
  const { empty } = useConversation();
  if (!empty) return null;
  return <div {...props} data-aifk-conversation-empty="">{children}</div>;
}

function Status({ children, ...props }: ComponentPropsWithoutRef<"span">) {
  const { activity } = useConversation();
  const label = activity === "streaming"
    ? "Generating response"
    : activity === "submitted"
      ? "Message sent"
      : activity === "awaiting-approval"
        ? "Awaiting approval"
      : activity === "completed"
        ? "Conversation ready"
    : activity === "interrupted"
      ? "Response interrupted. Partial response preserved."
      : activity === "failed"
        ? "Response failed"
        : "Conversation ready";
  return (
    <span {...props} data-aifk-conversation-status={activity} role="status" aria-live="polite" aria-atomic="true">
      {children ?? label}
    </span>
  );
}

function ScrollToLatest({ children = "Scroll to latest", onClick, ...props }: ComponentPropsWithoutRef<"button">) {
  const { atEnd, empty, viewport, setAtEnd } = useConversation();
  if (empty || atEnd) return null;
  return (
    <button
      type="button"
      {...props}
      data-aifk-conversation-scroll-to-latest=""
      onClick={(event) => {
        const reducedMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        viewport?.scrollTo({ top: viewport.scrollHeight, behavior: reducedMotion ? "auto" : "smooth" });
        setAtEnd(true);
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}

export const ConversationPrimitive = { Root, Viewport, List, Items, Empty, Status, ScrollToLatest };
