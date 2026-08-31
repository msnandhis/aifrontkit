import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { ARTIFACT_REVIEW_COMMAND_SCHEMA_VERSION, assertCommand, ATTACHMENT_COMMAND_SCHEMA_VERSION, COMMAND_SCHEMA_VERSION, createCommandDispatcher, InvalidCommandError, LEGACY_COMMAND_SCHEMA_VERSION, PREVIOUS_COMMAND_SCHEMA_VERSION, type AIFrontCommand, type AttachmentUpload } from "../src/index.js";

const command: AIFrontCommand = {
  schemaVersion: 1,
  id: "command-1",
  threadId: "thread-1",
  timestamp: 1,
  type: "approval.resolve",
  approvalId: "approval-1",
  resolution: "approved"
};

describe("frontend command contract", () => {
  it("validates provider-neutral user intent", () => {
    expect(() => assertCommand(command)).not.toThrow();
    expect(() => assertCommand({ ...command, resolution: "maybe" })).toThrow(InvalidCommandError);
  });

  it("validates before sending through an application-owned transport", async () => {
    const send = vi.fn();
    const dispatch = createCommandDispatcher({ send });
    await dispatch(command);
    expect(send).toHaveBeenCalledWith(command);
  });

  it("rejects empty message payloads at the trust boundary", () => {
    expect(() => assertCommand({
      schemaVersion: 1, id: "command-2", threadId: "thread-1", timestamp: 2,
      type: "message.send", messageId: "message-1", parts: []
    })).toThrow(/non-empty/);
  });

  it("accepts a provider-neutral manual connection retry", () => {
    expect(() => assertCommand({
      schemaVersion: 1, id: "connection-retry", threadId: "thread-1", timestamp: 3,
      type: "connection.retry"
    })).not.toThrow();
  });

  it("keeps every v1 command available after advancing the current schema", () => {
    expect(LEGACY_COMMAND_SCHEMA_VERSION).toBe(1);
    expect(ARTIFACT_REVIEW_COMMAND_SCHEMA_VERSION).toBe(2);
    expect(ATTACHMENT_COMMAND_SCHEMA_VERSION).toBe(3);
    expect(PREVIOUS_COMMAND_SCHEMA_VERSION).toBe(3);
    expect(COMMAND_SCHEMA_VERSION).toBe(4);
    expect(() => assertCommand(command)).not.toThrow();
    expect(() => assertCommand({ ...command, schemaVersion: 2 })).not.toThrow();
    expect(() => assertCommand({ ...command, schemaVersion: 3 })).not.toThrow();
    expect(() => assertCommand({ ...command, schemaVersion: 4 })).not.toThrow();
  });

  it("validates a version-bound artifact review resolution", () => {
    const reviewCommand: AIFrontCommand = {
      schemaVersion: 2,
      id: "review-1",
      threadId: "thread-1",
      timestamp: 4,
      type: "artifact.review.resolve",
      artifactId: "artifact-1",
      version: 3,
      resolution: "changes-requested",
      comment: "Add source citations"
    };
    expect(() => assertCommand(reviewCommand)).not.toThrow();
    expect(() => assertCommand({ ...reviewCommand, schemaVersion: 1 })).toThrow(/requires command schema version 2 or newer/);
    expect(() => assertCommand({ ...reviewCommand, schemaVersion: 3 })).not.toThrow();
    expect(() => assertCommand({ ...reviewCommand, schemaVersion: 4 })).not.toThrow();
    expect(() => assertCommand({ ...reviewCommand, version: 0 })).toThrow(/positive integer/);
    expect(() => assertCommand({ ...reviewCommand, resolution: "rejected" })).toThrow(/resolution is invalid/);
    expect(() => assertCommand({ ...reviewCommand, comment: " " })).toThrow(/non-empty string/);
  });

  it("publishes the v2 command schema with artifact review provenance fields", () => {
    const schemaUrl = new URL("../schemas/v2/command.schema.json", import.meta.url);
    const schema = JSON.parse(readFileSync(schemaUrl, "utf8")) as { properties: { type: { enum: string[] } }; allOf: unknown[] };
    expect(schema.properties.type.enum).toContain("artifact.review.resolve");
    expect(schema.allOf).toHaveLength(1);
  });

  it("adds retry and cancel attachment intent in command schema v3 and newer", () => {
    const retryCommand: AIFrontCommand = {
      schemaVersion: 3,
      id: "attachment-retry-1",
      threadId: "thread-1",
      timestamp: 5,
      type: "attachment.retry",
      attachmentId: "attachment-1"
    };
    expect(() => assertCommand(retryCommand)).not.toThrow();
    expect(() => assertCommand({ ...retryCommand, type: "attachment.cancel" })).not.toThrow();
    expect(() => assertCommand({ ...retryCommand, schemaVersion: 2 })).toThrow(/requires command schema version 3/);
    expect(() => assertCommand({ ...retryCommand, schemaVersion: 1 })).toThrow(/requires command schema version 3/);
    expect(() => assertCommand({ ...retryCommand, schemaVersion: 4 })).not.toThrow();
    expect(() => assertCommand({ ...retryCommand, attachmentId: "" })).toThrow(/non-empty string/);
    expect(() => assertCommand({ ...retryCommand, attachmentId: "   " })).toThrow(/non-empty string/);

    const schemaUrl = new URL("../schemas/v3/command.schema.json", import.meta.url);
    const schema = JSON.parse(readFileSync(schemaUrl, "utf8")) as { properties: { schemaVersion: { const: number }; type: { enum: string[] } }; allOf: unknown[] };
    expect(schema.properties.schemaVersion.const).toBe(3);
    expect(schema.properties.type.enum).toContain("attachment.retry");
    expect(schema.properties.type.enum).toContain("attachment.cancel");
    expect(schema.allOf).toHaveLength(2);
  });

  it("adds version-bound checkpoint restore and task restart intent only in v4", () => {
    const restoreCommand: AIFrontCommand = {
      schemaVersion: 4,
      id: "checkpoint-restore-1",
      threadId: "thread-1",
      timestamp: 6,
      type: "checkpoint.restore",
      checkpointId: "checkpoint-1",
      checkpointVersion: 2
    };
    const restartCommand: AIFrontCommand = {
      schemaVersion: 4,
      id: "task-restart-1",
      threadId: "thread-1",
      timestamp: 7,
      type: "task.restart",
      taskId: "task-1",
      expectedTaskVersion: 3
    };
    expect(() => assertCommand(restoreCommand)).not.toThrow();
    expect(() => assertCommand(restartCommand)).not.toThrow();
    expect(() => assertCommand({ ...restoreCommand, schemaVersion: 3 })).toThrow(/requires command schema version 4/);
    expect(() => assertCommand({ ...restartCommand, schemaVersion: 3 })).toThrow(/requires command schema version 4/);
    expect(() => assertCommand({ ...restoreCommand, checkpointVersion: 0 })).toThrow(/positive integer/);
    expect(() => assertCommand({ ...restartCommand, expectedTaskVersion: 1.5 })).toThrow(/positive integer/);
    expect(() => assertCommand({ ...restoreCommand, checkpointId: " " })).toThrow(/non-empty string/);

    const schemaUrl = new URL("../schemas/v4/command.schema.json", import.meta.url);
    const schema = JSON.parse(readFileSync(schemaUrl, "utf8")) as { properties: { schemaVersion: { const: number }; type: { enum: string[] } }; allOf: unknown[] };
    expect(schema.properties.schemaVersion.const).toBe(4);
    expect(schema.properties.type.enum).toContain("checkpoint.restore");
    expect(schema.properties.type.enum).toContain("task.restart");
    expect(schema.allOf).toHaveLength(4);
  });

  it("models composer-local transfer state separately from transcript file status", () => {
    const upload: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf", mediaType: "application/pdf", size: 1200 },
      status: "failed",
      progress: { current: 600, total: 1200 },
      error: { message: "Upload interrupted.", code: "NETWORK", recovery: "retry" },
      attempt: 1
    };
    expect(upload.file).not.toHaveProperty("status");
    expect(upload.status).toBe("failed");
    expect(upload.error?.recovery).toBe("retry");
  });
});
