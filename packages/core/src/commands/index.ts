import type { ContentPart } from "../model/index.js";

export const COMMAND_SCHEMA_VERSION = 1 as const;

interface CommandEnvelope {
  schemaVersion: typeof COMMAND_SCHEMA_VERSION;
  id: string;
  threadId: string;
  timestamp: number;
}

/**
 * Provider-neutral user intent emitted by UI behavior. Commands never execute
 * models or tools. Applications decide how to transport and authorize them.
 */
export type AIFrontCommand =
  | (CommandEnvelope & { type: "message.send"; messageId: string; parts: ContentPart[]; metadata?: Record<string, unknown> })
  | (CommandEnvelope & { type: "message.retry"; messageId: string })
  | (CommandEnvelope & { type: "connection.retry" })
  | (CommandEnvelope & { type: "task.stop"; taskId: string; reason?: string })
  | (CommandEnvelope & { type: "task.resume"; taskId: string })
  | (CommandEnvelope & { type: "approval.resolve"; approvalId: string; resolution: "approved" | "rejected" })
  | (CommandEnvelope & { type: "attachment.remove"; attachmentId: string })
  | (CommandEnvelope & { type: "error.dismiss"; errorId: string });

export class InvalidCommandError extends Error {
  readonly code = "INVALID_COMMAND";
}

export function assertCommand(value: unknown): asserts value is AIFrontCommand {
  if (!value || typeof value !== "object") throw new InvalidCommandError("Command must be an object.");
  const command = value as Record<string, unknown>;
  if (command.schemaVersion !== COMMAND_SCHEMA_VERSION) throw new InvalidCommandError(`Unsupported command schema version: ${String(command.schemaVersion)}`);
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
    case "attachment.remove": requiredString(command, "attachmentId"); return;
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
  if (typeof value[field] !== "string" || value[field] === "") throw new InvalidCommandError(`Command field ${field} must be a non-empty string.`);
}
