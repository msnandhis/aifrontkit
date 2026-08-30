import { describe, expect, it, vi } from "vitest";
import { assertCommand, createCommandDispatcher, InvalidCommandError, type AIFrontCommand } from "../src/index.js";

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
});
