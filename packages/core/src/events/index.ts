import type { Artifact, ConnectionStatus, ContentPart, MessageRole, PartStatus, TaskProgress, TaskStatus, TaskStep, ToolStatus } from "../model/index.js";
import type { AgentCheckpoint, AgentCheckpointKind, AgentCheckpointStatus } from "../checkpoint/index.js";

/** Current wire format. Older schemas remain accepted through migrations. */
export const LEGACY_EVENT_SCHEMA_VERSION = 1 as const;
export const PART_EVENT_SCHEMA_VERSION = 2 as const;
export const TASK_EVENT_SCHEMA_VERSION = 3 as const;
export const EVENT_SCHEMA_VERSION = 4 as const;

interface EventEnvelope<TVersion extends number> {
  schemaVersion: TVersion;
  id: string;
  threadId: string;
  timestamp: number;
}

export type AIFrontEventV1 =
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "message.started"; messageId: string; role: MessageRole })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "message.delta"; messageId: string; delta: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "message.completed"; messageId: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "message.interrupted"; messageId: string; reason?: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "message.failed"; messageId: string; error: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "tool.updated"; toolCallId: string; messageId?: string; name: string; status: ToolStatus; input?: unknown; output?: unknown; error?: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "approval.requested"; approvalId: string; toolCallId: string; summary: string })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "approval.resolved"; approvalId: string; resolution: "approved" | "rejected" | "expired" })
  | (EventEnvelope<typeof LEGACY_EVENT_SCHEMA_VERSION> & { type: "artifact.updated"; artifact: Artifact });

export type AIFrontEventV2 =
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.started"; messageId: string; role: MessageRole; parts?: ContentPart[] })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.part.added"; messageId: string; partId: string; part: ContentPart })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.part.delta"; messageId: string; partId: string; delta: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.part.updated"; messageId: string; partId: string; part: ContentPart })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.part.status"; messageId: string; partId: string; status: PartStatus; error?: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.completed"; messageId: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.interrupted"; messageId: string; reason?: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "message.failed"; messageId: string; error: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "tool.updated"; toolCallId: string; messageId?: string; partId?: string; name: string; status: ToolStatus; input?: unknown; output?: unknown; error?: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "approval.requested"; approvalId: string; toolCallId: string; summary: string })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "approval.resolved"; approvalId: string; resolution: "approved" | "rejected" | "expired" })
  | (EventEnvelope<typeof PART_EVENT_SCHEMA_VERSION> & { type: "artifact.updated"; artifact: Artifact });

type WithSchemaVersion<T, TVersion extends number> = T extends EventEnvelope<number> ? Omit<T, "schemaVersion"> & { schemaVersion: TVersion } : never;

export type AIFrontEventV3 =
  | WithSchemaVersion<AIFrontEventV2, typeof TASK_EVENT_SCHEMA_VERSION>
  | (EventEnvelope<typeof TASK_EVENT_SCHEMA_VERSION> & { type: "task.started"; taskId: string; title: string; metadata?: Record<string, unknown> })
  | (EventEnvelope<typeof TASK_EVENT_SCHEMA_VERSION> & { type: "task.updated"; taskId: string; status: TaskStatus; progress?: TaskProgress; error?: string })
  | (EventEnvelope<typeof TASK_EVENT_SCHEMA_VERSION> & { type: "task.step.updated"; taskId: string; step: TaskStep })
  | (EventEnvelope<typeof TASK_EVENT_SCHEMA_VERSION> & { type: "connection.changed"; status: ConnectionStatus; attempt?: number; nextRetryAt?: number; reason?: string; error?: string });

export type AIFrontEventV4 =
  | WithSchemaVersion<AIFrontEventV3, typeof EVENT_SCHEMA_VERSION>
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "checkpoint.updated"; checkpoint: AgentCheckpoint });

/** A runtime consumes all supported generations; new emitters should produce v4. */
export type AIFrontEvent = AIFrontEventV1 | AIFrontEventV2 | AIFrontEventV3 | AIFrontEventV4;

export class InvalidEventError extends Error {
  readonly code = "INVALID_EVENT";
}

export function isAIFrontEventV2(value: AIFrontEvent): value is AIFrontEventV2 {
  return value.schemaVersion === PART_EVENT_SCHEMA_VERSION;
}

export function isAIFrontEventV3(value: AIFrontEvent): value is AIFrontEventV3 {
  return value.schemaVersion === TASK_EVENT_SCHEMA_VERSION;
}

export function isAIFrontEventV4(value: AIFrontEvent): value is AIFrontEventV4 {
  return value.schemaVersion === EVENT_SCHEMA_VERSION;
}

export function assertEvent(value: unknown): asserts value is AIFrontEvent {
  if (!value || typeof value !== "object") throw new InvalidEventError("Event must be an object.");
  const event = value as Record<string, unknown>;
  if (event.schemaVersion !== EVENT_SCHEMA_VERSION && event.schemaVersion !== TASK_EVENT_SCHEMA_VERSION && event.schemaVersion !== PART_EVENT_SCHEMA_VERSION && event.schemaVersion !== LEGACY_EVENT_SCHEMA_VERSION) {
    throw new InvalidEventError(`Unsupported schema version: ${String(event.schemaVersion)}`);
  }
  for (const field of ["id", "threadId", "type"]) {
    if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Event field ${field} must be a non-empty string.`);
  }
  if (typeof event.timestamp !== "number" || !Number.isFinite(event.timestamp)) throw new InvalidEventError("Event timestamp must be finite.");
  if (event.schemaVersion !== LEGACY_EVENT_SCHEMA_VERSION && typeof event.type === "string" && event.type.startsWith("message.part.")) {
    for (const field of ["messageId", "partId"]) {
      if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Part event field ${field} must be a non-empty string.`);
    }
  }
  if (event.schemaVersion !== LEGACY_EVENT_SCHEMA_VERSION) assertCurrentPayload(event);
}

function requiredString(event: Record<string, unknown>, field: string) {
  if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Event field ${field} must be a non-empty string.`);
}

function assertCurrentPayload(event: Record<string, unknown>) {
  switch (event.type) {
    case "message.started":
      requiredString(event, "messageId");
      if (event.role !== "user" && event.role !== "assistant" && event.role !== "system" && event.role !== "tool") throw new InvalidEventError("message.started role is invalid.");
      if (event.parts !== undefined && !Array.isArray(event.parts)) throw new InvalidEventError("message.started parts must be an array.");
      return;
    case "message.part.added":
    case "message.part.updated":
      if (!event.part || typeof event.part !== "object" || typeof (event.part as Record<string, unknown>).type !== "string") throw new InvalidEventError(`${event.type} part must be a typed object.`);
      return;
    case "message.part.delta":
      if (typeof event.delta !== "string") throw new InvalidEventError("message.part.delta delta must be a string.");
      return;
    case "message.part.status":
      if (!isPartStatus(event.status)) throw new InvalidEventError("message.part.status status is invalid.");
      return;
    case "message.completed":
    case "message.interrupted":
      requiredString(event, "messageId");
      return;
    case "message.failed":
      requiredString(event, "messageId");
      requiredString(event, "error");
      return;
    case "tool.updated":
      requiredString(event, "toolCallId");
      requiredString(event, "name");
      if (!isToolStatus(event.status)) throw new InvalidEventError("tool.updated status is invalid.");
      return;
    case "approval.requested":
      requiredString(event, "approvalId"); requiredString(event, "toolCallId"); requiredString(event, "summary"); return;
    case "approval.resolved":
      requiredString(event, "approvalId");
      if (event.resolution !== "approved" && event.resolution !== "rejected" && event.resolution !== "expired") throw new InvalidEventError("approval.resolved resolution is invalid.");
      return;
    case "artifact.updated":
      if (!event.artifact || typeof event.artifact !== "object") throw new InvalidEventError("artifact.updated artifact must be an object.");
      assertArtifact(event.artifact as Record<string, unknown>);
      return;
    case "task.started":
      requireSchemaVersionAtLeast(event, TASK_EVENT_SCHEMA_VERSION, "Task events");
      requiredString(event, "taskId"); requiredString(event, "title"); return;
    case "task.updated":
      requireSchemaVersionAtLeast(event, TASK_EVENT_SCHEMA_VERSION, "Task events");
      requiredString(event, "taskId");
      if (!isTaskStatus(event.status)) throw new InvalidEventError("task.updated status is invalid.");
      assertProgress(event.progress);
      return;
    case "task.step.updated":
      requireSchemaVersionAtLeast(event, TASK_EVENT_SCHEMA_VERSION, "Task events");
      requiredString(event, "taskId");
      if (!event.step || typeof event.step !== "object") throw new InvalidEventError("task.step.updated step must be an object.");
      requiredString(event.step as Record<string, unknown>, "id");
      requiredString(event.step as Record<string, unknown>, "title");
      if ((event.step as Record<string, unknown>).taskId !== event.taskId) throw new InvalidEventError("task.step.updated step.taskId must match taskId.");
      if (!isTaskStepStatus((event.step as Record<string, unknown>).status)) throw new InvalidEventError("task.step.updated step status is invalid.");
      assertProgress((event.step as Record<string, unknown>).progress);
      return;
    case "connection.changed":
      requireSchemaVersionAtLeast(event, TASK_EVENT_SCHEMA_VERSION, "Connection events");
      if (!isConnectionStatus(event.status)) throw new InvalidEventError("connection.changed status is invalid.");
      if (event.attempt !== undefined && (!Number.isInteger(event.attempt) || (event.attempt as number) < 0)) throw new InvalidEventError("connection.changed attempt must be a non-negative integer.");
      if (event.nextRetryAt !== undefined && (typeof event.nextRetryAt !== "number" || !Number.isFinite(event.nextRetryAt))) throw new InvalidEventError("connection.changed nextRetryAt must be finite.");
      if (event.reason !== undefined && (typeof event.reason !== "string" || event.reason === "")) throw new InvalidEventError("connection.changed reason must be a non-empty string.");
      if (event.error !== undefined && (typeof event.error !== "string" || event.error === "")) throw new InvalidEventError("connection.changed error must be a non-empty string.");
      if (event.status === "failed" && (typeof event.error !== "string" || event.error === "")) throw new InvalidEventError("connection.changed failed status requires an error.");
      return;
    case "checkpoint.updated":
      if (event.schemaVersion !== EVENT_SCHEMA_VERSION) throw new InvalidEventError("Checkpoint events require schema version 4.");
      if (!event.checkpoint || typeof event.checkpoint !== "object") throw new InvalidEventError("checkpoint.updated checkpoint must be an object.");
      assertCheckpoint(event.checkpoint as Record<string, unknown>);
      return;
    default:
      throw new InvalidEventError(`Unsupported event type: ${String(event.type)}.`);
  }
}

function requireSchemaVersionAtLeast(event: Record<string, unknown>, minimum: number, label: string) {
  if (typeof event.schemaVersion !== "number" || event.schemaVersion < minimum) throw new InvalidEventError(`${label} require schema version ${minimum} or newer.`);
}

function isPartStatus(value: unknown): value is PartStatus {
  return value === "pending" || value === "streaming" || value === "complete" || value === "interrupted" || value === "failed";
}

function isToolStatus(value: unknown): value is ToolStatus {
  return value === "pending" || value === "input-streaming" || value === "running" || value === "approval-requested" || value === "approved" || value === "denied" || value === "output-available" || value === "complete" || value === "failed" || value === "cancelled";
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return value === "queued" || value === "running" || value === "awaiting-approval" || value === "paused" || value === "complete" || value === "failed" || value === "cancelled";
}

function isConnectionStatus(value: unknown): value is ConnectionStatus {
  return value === "connected" || value === "reconnecting" || value === "offline" || value === "failed";
}

function isTaskStepStatus(value: unknown) {
  return value === "pending" || value === "running" || value === "complete" || value === "failed" || value === "cancelled" || value === "skipped";
}

function assertProgress(value: unknown) {
  if (value === undefined) return;
  if (!value || typeof value !== "object") throw new InvalidEventError("Progress must be an object.");
  const progress = value as Record<string, unknown>;
  if (typeof progress.current !== "number" || !Number.isFinite(progress.current) || progress.current < 0) throw new InvalidEventError("Progress current must be a non-negative finite number.");
  if (progress.total !== undefined && (typeof progress.total !== "number" || !Number.isFinite(progress.total) || progress.total <= 0 || progress.current > progress.total)) throw new InvalidEventError("Progress total must be positive and at least current.");
}

function assertArtifact(artifact: Record<string, unknown>) {
  requiredString(artifact, "id");
  requiredString(artifact, "title");
  requiredString(artifact, "kind");
  if (!Number.isInteger(artifact.version) || (artifact.version as number) < 1) throw new InvalidEventError("Artifact version must be a positive integer.");
  if (artifact.status !== "streaming" && artifact.status !== "ready" && artifact.status !== "failed") throw new InvalidEventError("Artifact status is invalid.");
  if (artifact.updatedAt !== undefined && (typeof artifact.updatedAt !== "number" || !Number.isFinite(artifact.updatedAt))) throw new InvalidEventError("Artifact updatedAt must be finite.");
  if (artifact.error !== undefined && (typeof artifact.error !== "string" || artifact.error === "")) throw new InvalidEventError("Artifact error must be a non-empty string.");
  if (artifact.review === undefined) return;
  if (!artifact.review || typeof artifact.review !== "object") throw new InvalidEventError("Artifact review must be an object.");
  const review = artifact.review as Record<string, unknown>;
  if (!Number.isInteger(review.version) || (review.version as number) < 1 || (review.version as number) > (artifact.version as number)) {
    throw new InvalidEventError("Artifact review version must be positive and cannot be newer than the artifact version.");
  }
  if (review.status !== "requested" && review.status !== "accepted" && review.status !== "changes-requested") throw new InvalidEventError("Artifact review status is invalid.");
  if (typeof review.updatedAt !== "number" || !Number.isFinite(review.updatedAt)) throw new InvalidEventError("Artifact review updatedAt must be finite.");
  if (review.comment !== undefined && (typeof review.comment !== "string" || review.comment.trim() === "")) throw new InvalidEventError("Artifact review comment must be a non-empty string when provided.");
}

function assertCheckpoint(checkpoint: Record<string, unknown>) {
  requiredString(checkpoint, "id");
  requiredString(checkpoint, "title");
  if (!Number.isInteger(checkpoint.version) || (checkpoint.version as number) < 1) throw new InvalidEventError("Checkpoint version must be a positive integer.");
  if (!Number.isInteger(checkpoint.sequence) || (checkpoint.sequence as number) < 0) throw new InvalidEventError("Checkpoint sequence must be a non-negative integer.");
  if (!isCheckpointKind(checkpoint.kind)) throw new InvalidEventError("Checkpoint kind is invalid.");
  if (!isCheckpointStatus(checkpoint.status)) throw new InvalidEventError("Checkpoint status is invalid.");
  if (typeof checkpoint.restorable !== "boolean") throw new InvalidEventError("Checkpoint restorable must be a boolean.");
  for (const field of ["createdAt", "updatedAt", "expiresAt"]) {
    const value = checkpoint[field];
    if (value !== undefined && (typeof value !== "number" || !Number.isFinite(value))) throw new InvalidEventError(`Checkpoint ${field} must be finite.`);
  }
  if (typeof checkpoint.createdAt !== "number") throw new InvalidEventError("Checkpoint createdAt is required.");
  if (typeof checkpoint.updatedAt !== "number") throw new InvalidEventError("Checkpoint updatedAt is required.");
  if ((checkpoint.updatedAt as number) < (checkpoint.createdAt as number)) throw new InvalidEventError("Checkpoint updatedAt cannot be earlier than createdAt.");
  if (checkpoint.expiresAt !== undefined && (checkpoint.expiresAt as number) < (checkpoint.createdAt as number)) throw new InvalidEventError("Checkpoint expiresAt cannot be earlier than createdAt.");
  for (const field of ["summary", "sourceTaskId", "sourceStepId", "reason", "error"]) {
    if (checkpoint[field] !== undefined && (typeof checkpoint[field] !== "string" || (checkpoint[field] as string).trim() === "")) throw new InvalidEventError(`Checkpoint ${field} must be a non-empty string.`);
  }
  if (checkpoint.sourceTaskVersion !== undefined && (!Number.isInteger(checkpoint.sourceTaskVersion) || (checkpoint.sourceTaskVersion as number) < 1)) throw new InvalidEventError("Checkpoint sourceTaskVersion must be a positive integer.");
  if (checkpoint.completedStepIds !== undefined) {
    if (!Array.isArray(checkpoint.completedStepIds) || checkpoint.completedStepIds.some((id) => typeof id !== "string" || id.trim() === "")) throw new InvalidEventError("Checkpoint completedStepIds must contain non-empty strings.");
    if (new Set(checkpoint.completedStepIds).size !== checkpoint.completedStepIds.length) throw new InvalidEventError("Checkpoint completedStepIds must be unique.");
  }
  if (checkpoint.metadata !== undefined && (!checkpoint.metadata || typeof checkpoint.metadata !== "object" || Array.isArray(checkpoint.metadata))) throw new InvalidEventError("Checkpoint metadata must be an object.");
}

function isCheckpointKind(value: unknown): value is AgentCheckpointKind {
  return value === "automatic" || value === "manual" || value === "approval-boundary" || value === "interruption";
}

function isCheckpointStatus(value: unknown): value is AgentCheckpointStatus {
  return value === "available" || value === "restoring" || value === "restored" || value === "failed" || value === "expired" || value === "incompatible" || value === "superseded";
}
