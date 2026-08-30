import { EVENT_SCHEMA_VERSION, PART_EVENT_SCHEMA_VERSION, type AIFrontEvent, type AIFrontEventV1, type AIFrontEventV2, type AIFrontEventV3 } from "../events/index.js";

export interface SchemaMigration<TInput = unknown, TOutput = unknown> {
  from: number;
  to: number;
  migrate(input: TInput): TOutput;
}

export function registerMigration<TInput, TOutput>(migration: SchemaMigration<TInput, TOutput>): SchemaMigration<TInput, TOutput> {
  if (migration.to !== migration.from + 1) throw new Error("Schema migrations must advance exactly one major version.");
  return migration;
}

/** Converts v1's implicit first text part into v2's explicit address. */
export function migrateEventToV2(event: AIFrontEventV1 | AIFrontEventV2): AIFrontEventV2 {
  if (event.schemaVersion === PART_EVENT_SCHEMA_VERSION) return event;
  return migrateV1EventToV2(event);
}

export function migrateEventToCurrent(event: AIFrontEvent): AIFrontEventV3 {
  if (event.schemaVersion === EVENT_SCHEMA_VERSION) return event;
  const v2 = event.schemaVersion === PART_EVENT_SCHEMA_VERSION ? event : migrateV1EventToV2(event);
  return v2ToV3EventMigration.migrate(v2);
}

export const v1ToV2EventMigration = registerMigration<AIFrontEventV1, AIFrontEventV2>({
  from: 1,
  to: 2,
  migrate: migrateV1EventToV2
});

export const v2ToV3EventMigration = registerMigration<AIFrontEventV2, AIFrontEventV3>({
  from: 2,
  to: 3,
  migrate: (event) => ({ ...event, schemaVersion: EVENT_SCHEMA_VERSION }) as AIFrontEventV3
});

function migrateV1EventToV2(event: AIFrontEventV1): AIFrontEventV2 {
  const envelope = { schemaVersion: PART_EVENT_SCHEMA_VERSION, id: event.id, threadId: event.threadId, timestamp: event.timestamp } as const;
  switch (event.type) {
    case "message.started": return { ...envelope, type: event.type, messageId: event.messageId, role: event.role };
    case "message.delta": return { ...envelope, type: "message.part.delta", messageId: event.messageId, partId: "text:0", delta: event.delta };
    case "message.completed": return { ...envelope, type: event.type, messageId: event.messageId };
    case "message.interrupted": return { ...envelope, type: event.type, messageId: event.messageId, ...(event.reason === undefined ? {} : { reason: event.reason }) };
    case "message.failed": return { ...envelope, type: event.type, messageId: event.messageId, error: event.error };
    case "tool.updated": return { ...envelope, type: event.type, toolCallId: event.toolCallId, name: event.name, status: event.status, ...(event.messageId === undefined ? {} : { messageId: event.messageId }), ...(event.input === undefined ? {} : { input: event.input }), ...(event.output === undefined ? {} : { output: event.output }), ...(event.error === undefined ? {} : { error: event.error }) };
    case "approval.requested": return { ...envelope, type: event.type, approvalId: event.approvalId, toolCallId: event.toolCallId, summary: event.summary };
    case "approval.resolved": return { ...envelope, type: event.type, approvalId: event.approvalId, resolution: event.resolution };
    case "artifact.updated": return { ...envelope, type: event.type, artifact: event.artifact };
  }
}
