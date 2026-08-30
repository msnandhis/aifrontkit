import type { FileContentPart } from "../content/index.js";

/** Roles describe authorship, never a provider-specific protocol. */
export type MessageRole = "user" | "assistant" | "system" | "tool";
/** Lifecycle of one message, independent of part and tool lifecycles. */
export type MessageStatus = "pending" | "streaming" | "complete" | "interrupted" | "failed";
/** Lifecycle of a transcript as a whole. */
export type ConversationStatus = "idle" | "submitted" | "streaming" | "awaiting-approval" | "completed" | "interrupted" | "failed";
/** Lifecycle of one ordered message part. */
export type PartStatus = "pending" | "streaming" | "complete" | "interrupted" | "failed";
/** Lifecycle of a tool invocation. */
export type ToolStatus = "pending" | "input-streaming" | "running" | "approval-requested" | "approved" | "denied" | "output-available" | "complete" | "failed" | "cancelled";
/** Lifecycle of a long-running agent task shown independently from messages. */
export type TaskStatus = "queued" | "running" | "awaiting-approval" | "paused" | "complete" | "failed" | "cancelled";
/** Lifecycle of one task step. */
export type TaskStepStatus = "pending" | "running" | "complete" | "failed" | "cancelled" | "skipped";

/** IDs are required by v2 part-addressed events; persisted v1 data may omit them. */
export interface BaseContentPart {
  id?: string;
  partStatus?: PartStatus;
}

export interface TextContentPart extends BaseContentPart {
  type: "text";
  text: string;
}

export interface ImageContentPart extends BaseContentPart {
  type: "image";
  url: string;
  alt?: string;
  mediaType?: string;
}

export interface SourceContentPart extends BaseContentPart {
  type: "source";
  title?: string;
  url?: string;
  sourceId?: string;
  excerpt?: string;
  metadata?: Record<string, unknown>;
}

export interface ReasoningContentPart extends BaseContentPart {
  type: "reasoning";
  text: string;
  summary?: string;
  visible?: boolean;
}

/** A tool part preserves position in a transcript; ToolCall remains a fast index. */
export interface ToolContentPart extends BaseContentPart {
  type: "tool";
  toolCallId: string;
  name: string;
  toolStatus: ToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
}

/** Provider-neutral structured data such as a chart payload or application state. */
export interface DataContentPart extends BaseContentPart {
  type: "data";
  data: unknown;
  name?: string;
  mediaType?: string;
}

/** Namespaced custom parts let integrations retain precise domain data. */
export interface CustomContentPart extends BaseContentPart {
  type: `custom:${string}`;
  data: unknown;
  name?: string;
  [key: string]: unknown;
}

export type KnownContentPart =
  | TextContentPart
  | ImageContentPart
  | FileContentPart
  | SourceContentPart
  | ReasoningContentPart
  | ToolContentPart
  | DataContentPart
  | CustomContentPart;

/** @deprecated Prefer KnownContentPart. Retained for v1 source compatibility. */
export type ContentPart = KnownContentPart;

export interface Message<TMetadata = unknown, TCustomPart extends BaseContentPart = never> {
  id: string;
  threadId: string;
  role: MessageRole;
  status: MessageStatus;
  /** Ordered, heterogeneous transcript units. */
  parts: readonly (KnownContentPart | TCustomPart)[];
  createdAt: number;
  completedAt?: number;
  error?: string;
  interruptionReason?: string;
  metadata?: TMetadata;
}

export interface ToolCall {
  id: string;
  messageId?: string;
  /** Matching `tool` part ID, when this call appears in the transcript. */
  partId?: string;
  name: string;
  status: ToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface Approval {
  id: string;
  toolCallId: string;
  summary: string;
  status: "requested" | "approved" | "rejected" | "expired";
}

export interface Artifact {
  id: string;
  title: string;
  kind: string;
  version: number;
  status: "streaming" | "ready" | "failed";
  content?: unknown;
}

export interface TaskProgress {
  current: number;
  total?: number;
  label?: string;
}

export interface TaskStep {
  id: string;
  taskId: string;
  title: string;
  status: TaskStepStatus;
  detail?: string;
  progress?: TaskProgress;
  startedAt?: number;
  completedAt?: number;
  error?: string;
}

/**
 * A frontend projection of long-running agent work. It describes observable
 * progress only and never exposes or executes a provider's hidden plan.
 */
export interface AgentTask {
  id: string;
  threadId: string;
  title: string;
  status: TaskStatus;
  stepOrder: readonly string[];
  steps: Readonly<Record<string, TaskStep>>;
  progress?: TaskProgress;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}
