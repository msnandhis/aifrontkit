import type { ContentPart } from "../model/index.js";

export const COMMAND_SCHEMA_VERSION = 3 as const;
export const PREVIOUS_COMMAND_SCHEMA_VERSION = 2 as const;
export const LEGACY_COMMAND_SCHEMA_VERSION = 1 as const;

interface CommandEnvelope<TVersion extends number> {
  schemaVersion: TVersion;
  id: string;
  threadId: string;
  timestamp: number;
}

/**
 * Provider-neutral user intent emitted by UI behavior. Commands never execute
 * models or tools. Applications decide how to transport and authorize them.
 */
export type AIFrontCommandV1 =
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "message.send"; messageId: string; parts: ContentPart[]; metadata?: Record<string, unknown> })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "message.retry"; messageId: string })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "connection.retry" })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "task.stop"; taskId: string; reason?: string })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "task.resume"; taskId: string })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "approval.resolve"; approvalId: string; resolution: "approved" | "rejected" })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "attachment.remove"; attachmentId: string })
  | (CommandEnvelope<typeof LEGACY_COMMAND_SCHEMA_VERSION> & { type: "error.dismiss"; errorId: string });

type WithSchemaVersion<T, TVersion extends number> = T extends CommandEnvelope<number> ? Omit<T, "schemaVersion"> & { schemaVersion: TVersion } : never;

export type AIFrontCommandV2 =
  | WithSchemaVersion<AIFrontCommandV1, typeof PREVIOUS_COMMAND_SCHEMA_VERSION>
  | (CommandEnvelope<typeof PREVIOUS_COMMAND_SCHEMA_VERSION> & {
      type: "artifact.review.resolve";
      artifactId: string;
      version: number;
      resolution: "accepted" | "changes-requested";
      comment?: string;
    });

export type AIFrontCommandV3 =
  | WithSchemaVersion<AIFrontCommandV2, typeof COMMAND_SCHEMA_VERSION>
  | (CommandEnvelope<typeof COMMAND_SCHEMA_VERSION> & { type: "attachment.retry"; attachmentId: string })
  | (CommandEnvelope<typeof COMMAND_SCHEMA_VERSION> & { type: "attachment.cancel"; attachmentId: string });

/** All supported commands. New emitters should use the current schema version. */
export type AIFrontCommand = AIFrontCommandV1 | AIFrontCommandV2 | AIFrontCommandV3;

export class InvalidCommandError extends Error {
  readonly code = "INVALID_COMMAND";
}

export function assertCommand(value: unknown): asserts value is AIFrontCommand {
  if (!value || typeof value !== "object") throw new InvalidCommandError("Command must be an object.");
  const command = value as Record<string, unknown>;
  if (command.schemaVersion !== COMMAND_SCHEMA_VERSION && command.schemaVersion !== PREVIOUS_COMMAND_SCHEMA_VERSION && command.schemaVersion !== LEGACY_COMMAND_SCHEMA_VERSION) {
    throw new InvalidCommandError(`Unsupported command schema version: ${String(command.schemaVersion)}`);
  }
  for (const field of ["id", "threadId", "type"]) requiredString(command, field);
  if (typeof command.timestamp !== "number" || !Number.isFinite(command.timestamp)) throw new InvalidCommandError("Command timestamp must be finite.");

  switch (command.type) {
    case "message.send":
      requiredString(command, "messageId");
      if (!Array.isArray(command.parts) || command.parts.length === 0) throw new InvalidCommandError("message.send parts must be a non-empty array.");
      if (command.parts.some((part) => !part || typeof part !== "object" || typeof (part as Record<string, unknown>).type !== "string")) throw new InvalidCommandError("message.send parts must contain typed objects.");
      return;
    case "message.retry": requiredString(command, "messageId"); return;
    case "connection.retry": return;
    case "task.stop":
    case "task.resume": requiredString(command, "taskId"); return;
    case "approval.resolve":
      requiredString(command, "approvalId");
      if (command.resolution !== "approved" && command.resolution !== "rejected") throw new InvalidCommandError("approval.resolve resolution is invalid.");
      return;
    case "artifact.review.resolve":
      if (command.schemaVersion === LEGACY_COMMAND_SCHEMA_VERSION) throw new InvalidCommandError("artifact.review.resolve requires command schema version 2 or newer.");
      requiredString(command, "artifactId");
      if (!Number.isInteger(command.version) || (command.version as number) < 1) throw new InvalidCommandError("artifact.review.resolve version must be a positive integer.");
      if (command.resolution !== "accepted" && command.resolution !== "changes-requested") throw new InvalidCommandError("artifact.review.resolve resolution is invalid.");
      if (command.comment !== undefined && (typeof command.comment !== "string" || command.comment.trim() === "")) throw new InvalidCommandError("artifact.review.resolve comment must be a non-empty string when provided.");
      return;
    case "attachment.remove": requiredString(command, "attachmentId"); return;
    case "attachment.retry":
    case "attachment.cancel":
      if (command.schemaVersion !== COMMAND_SCHEMA_VERSION) throw new InvalidCommandError(`${String(command.type)} requires command schema version 3.`);
      requiredString(command, "attachmentId");
      return;
    case "error.dismiss": requiredString(command, "errorId"); return;
    default: throw new InvalidCommandError(`Unsupported command type: ${String(command.type)}.`);
  }
}

export interface CommandTransport {
  send(command: AIFrontCommand): void | Promise<void>;
}

export function createCommandDispatcher(transport: CommandTransport) {
  return async (command: AIFrontCommand) => {
    assertCommand(command);
    await transport.send(command);
  };
}

function requiredString(value: Record<string, unknown>, field: string) {
  if (typeof value[field] !== "string" || value[field].trim() === "") throw new InvalidCommandError(`Command field ${field} must be a non-empty string.`);
}
