import type { Artifact, MessageRole, ToolStatus } from "../model/index.js";

export const EVENT_SCHEMA_VERSION = 1 as const;

interface EventEnvelope {
  schemaVersion: typeof EVENT_SCHEMA_VERSION;
  id: string;
  threadId: string;
  timestamp: number;
}

export type AIFrontEvent =
  | (EventEnvelope & { type: "message.started"; messageId: string; role: MessageRole })
  | (EventEnvelope & { type: "message.delta"; messageId: string; delta: string })
  | (EventEnvelope & { type: "message.completed"; messageId: string })
  | (EventEnvelope & { type: "message.failed"; messageId: string; error: string })
  | (EventEnvelope & { type: "tool.updated"; toolCallId: string; messageId?: string; name: string; status: ToolStatus; input?: unknown; output?: unknown; error?: string })
  | (EventEnvelope & { type: "approval.requested"; approvalId: string; toolCallId: string; summary: string })
  | (EventEnvelope & { type: "approval.resolved"; approvalId: string; resolution: "approved" | "rejected" | "expired" })
  | (EventEnvelope & { type: "artifact.updated"; artifact: Artifact });

export class InvalidEventError extends Error {
  readonly code = "INVALID_EVENT";
}

export function assertEvent(value: unknown): asserts value is AIFrontEvent {
  if (!value || typeof value !== "object") throw new InvalidEventError("Event must be an object.");
  const event = value as Record<string, unknown>;
  if (event.schemaVersion !== EVENT_SCHEMA_VERSION) throw new InvalidEventError(`Unsupported schema version: ${String(event.schemaVersion)}`);
  for (const field of ["id", "threadId", "type"]) {
    if (typeof event[field] !== "string" || event[field] === "") throw new InvalidEventError(`Event field ${field} must be a non-empty string.`);
  }
  if (typeof event.timestamp !== "number" || !Number.isFinite(event.timestamp)) throw new InvalidEventError("Event timestamp must be finite.");
}
