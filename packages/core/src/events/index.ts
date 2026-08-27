import type { Artifact, ContentPart, MessageRole, PartStatus, ToolStatus } from "../model/index.js";

/** Current wire format. Schema v1 remains accepted while producers migrate. */
export const EVENT_SCHEMA_VERSION = 2 as const;
export const LEGACY_EVENT_SCHEMA_VERSION = 1 as const;

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
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.started"; messageId: string; role: MessageRole; parts?: ContentPart[] })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.part.added"; messageId: string; partId: string; part: ContentPart })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.part.delta"; messageId: string; partId: string; delta: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.part.updated"; messageId: string; partId: string; part: ContentPart })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.part.status"; messageId: string; partId: string; status: PartStatus; error?: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.completed"; messageId: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.interrupted"; messageId: string; reason?: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "message.failed"; messageId: string; error: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "tool.updated"; toolCallId: string; messageId?: string; partId?: string; name: string; status: ToolStatus; input?: unknown; output?: unknown; error?: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "approval.requested"; approvalId: string; toolCallId: string; summary: string })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "approval.resolved"; approvalId: string; resolution: "approved" | "rejected" | "expired" })
  | (EventEnvelope<typeof EVENT_SCHEMA_VERSION> & { type: "artifact.updated"; artifact: Artifact });

/** A runtime consumes both generations; new emitters should produce v2. */
export type AIFrontEvent = AIFrontEventV1 | AIFrontEventV2;

export class InvalidEventError extends Error {
  readonly code = "INVALID_EVENT";
}

export function isAIFrontEventV2(value: AIFrontEvent): value is AIFrontEventV2 {
  return value.schemaVersion === EVENT_SCHEMA_VERSION;
}

export function assertEvent(value: unknown): asserts value is AIFrontEvent {
  if (!value || typeof value !== "object") throw new InvalidEventError("Event must be an object.");
  const event = value as Record<string, unknown>;
  if (event.schemaVersion !== EVENT_SCHEMA_VERSION && event.schemaVersion !== LEGACY_EVENT_SCHEMA_VERSION) {
    throw new InvalidEventError(`Unsupported schema version: ${String(event.schemaVersion)}`);
  }
  for (const field of ["id", "threadId", "type"]) {
    if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Event field ${field} must be a non-empty string.`);
  }
  if (typeof event.timestamp !== "number" || !Number.isFinite(event.timestamp)) throw new InvalidEventError("Event timestamp must be finite.");
  if (event.schemaVersion === EVENT_SCHEMA_VERSION && typeof event.type === "string" && event.type.startsWith("message.part.")) {
    for (const field of ["messageId", "partId"]) {
      if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Part event field ${field} must be a non-empty string.`);
    }
  }
  if (event.schemaVersion === EVENT_SCHEMA_VERSION) assertV2Payload(event);
}

function requiredString(event: Record<string, unknown>, field: string) {
  if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Event field ${field} must be a non-empty string.`);
}

function assertV2Payload(event: Record<string, unknown>) {
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
      return;
    default:
      throw new InvalidEventError(`Unsupported event type: ${String(event.type)}.`);
  }
}

function isPartStatus(value: unknown): value is PartStatus {
  return value === "pending" || value === "streaming" || value === "complete" || value === "interrupted" || value === "failed";
}

function isToolStatus(value: unknown): value is ToolStatus {
  return value === "pending" || value === "input-streaming" || value === "running" || value === "approval-requested" || value === "approved" || value === "denied" || value === "output-available" || value === "complete" || value === "failed" || value === "cancelled";
}
