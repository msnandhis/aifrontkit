import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { assertCommand, COMMAND_SCHEMA_VERSION, createCommandDispatcher, InvalidCommandError, LEGACY_COMMAND_SCHEMA_VERSION, type AIFrontCommand } from "../src/index.js";

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
    expect(COMMAND_SCHEMA_VERSION).toBe(2);
    expect(() => assertCommand(command)).not.toThrow();
    expect(() => assertCommand({ ...command, schemaVersion: 2 })).not.toThrow();
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
    expect(() => assertCommand({ ...reviewCommand, schemaVersion: 1 })).toThrow(/requires command schema version 2/);
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
});
