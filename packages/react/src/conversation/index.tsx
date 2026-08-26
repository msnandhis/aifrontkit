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
import { useRuntimeState } from "../runtime/index.js";

interface ConversationContextValue {
  messageIds: readonly string[];
  empty: boolean;
  streaming: boolean;
  activity: "idle" | "streaming" | "interrupted" | "failed";
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
}

function Root({ label = "Conversation", children, "aria-label": ariaLabel, ...props }: ConversationRootProps) {
  const messageIds = useRuntimeState((state) => state.messageOrder);
  const activity = useRuntimeState((state) => {
    const hasStreamingMessage = state.messageOrder.some((messageId) => state.messages[messageId]?.status === "streaming");
    if (hasStreamingMessage) return "streaming";
    const latestId = state.messageOrder.at(-1);
    const latestStatus = latestId ? state.messages[latestId]?.status : undefined;
    if (latestStatus === "interrupted" || latestStatus === "failed") return latestStatus;
    return "idle";
  });
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
