import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createRuntime, createRuntimeFromMessages, createStateFromMessages, getConversationStatus, migrateEventToCurrent, migrateEventToV2, reduceEvent, createInitialState, type AIFrontEvent } from "../src/index.js";

const base = { schemaVersion: 1, threadId: "thread-1", timestamp: 1 } as const;

describe("framework-neutral runtime", () => {
  it("reduces a streaming message deterministically and ignores duplicate events", () => {
    const events: AIFrontEvent[] = [
      { ...base, id: "1", type: "message.started", messageId: "m1", role: "assistant" },
      { ...base, id: "2", type: "message.delta", messageId: "m1", delta: "Hello" },
      { ...base, id: "3", type: "message.completed", messageId: "m1" }
    ];
    const state = [...events, events[1]!].reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.messages.m1?.parts).toEqual([{ type: "text", text: "Hello" }]);
    expect(state.messages.m1?.status).toBe("complete");
  });

  it("publishes only real state changes", () => {
    const runtime = createRuntime("thread-1");
    const listener = vi.fn();
    runtime.subscribe(listener);
    const event: AIFrontEvent = { ...base, id: "1", type: "message.started", messageId: "m1", role: "assistant" };
    runtime.dispatch(event);
    runtime.dispatch(event);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("creates provider-compatible state from controlled messages", () => {
    const runtime = createRuntimeFromMessages("controlled", [{
      id: "m1", threadId: "external", role: "user", status: "complete",
      parts: [{ type: "text", text: "Controlled message" }], createdAt: 1
    }]);
    expect(runtime.getState().messageOrder).toEqual(["m1"]);
    expect(runtime.getState().messages.m1).toMatchObject({ threadId: "controlled", role: "user" });
  });

  it("preserves partial content when a response is interrupted", () => {
    const events: AIFrontEvent[] = [
      { ...base, id: "interrupt-1", type: "message.started", messageId: "m-interrupted", role: "assistant" },
      { ...base, id: "interrupt-2", type: "message.delta", messageId: "m-interrupted", delta: "Partial response" },
      { ...base, id: "interrupt-3", type: "message.interrupted", messageId: "m-interrupted", reason: "Stopped by the user" }
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.messages["m-interrupted"]).toMatchObject({
      status: "interrupted",
      parts: [{ type: "text", text: "Partial response" }],
      interruptionReason: "Stopped by the user"
    });
  });

  it("rejects cross-thread events", () => {
    const event: AIFrontEvent = { ...base, threadId: "other", id: "1", type: "message.started", messageId: "m1", role: "assistant" };
    expect(() => reduceEvent(createInitialState("thread-1"), event)).toThrow(/does not match/);
  });

  it("advances tool status without an older record overwriting the update", () => {
    const pending: AIFrontEvent = { ...base, id: "tool-1", type: "tool.updated", toolCallId: "c1", name: "search", status: "pending" };
    const complete: AIFrontEvent = { ...base, id: "tool-2", type: "tool.updated", toolCallId: "c1", name: "search", status: "complete", output: { count: 2 } };
    const state = [pending, complete].reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.tools.c1).toMatchObject({ status: "complete", output: { count: 2 } });
  });

  it("continues to consume the checked-in schema v1 compatibility fixture", () => {
    const fixtureUrl = new URL("../../../compatibility/fixtures/schema-v1/conversation.json", import.meta.url);
    const events = JSON.parse(readFileSync(fixtureUrl, "utf8")) as AIFrontEvent[];
    const runtime = createRuntime("fixture-thread", events);
    expect(runtime.getState().messages["assistant-1"]).toMatchObject({
      role: "assistant",
      status: "complete",
      parts: [{ type: "text", text: "Hello" }]
    });
  });

  it("addresses ordered v2 parts without losing their transcript position", () => {
    const events: AIFrontEvent[] = [
      { schemaVersion: 2, id: "v2-1", threadId: "thread-1", timestamp: 1, type: "message.started", messageId: "m-v2", role: "assistant" },
      { schemaVersion: 2, id: "v2-2", threadId: "thread-1", timestamp: 2, type: "message.part.added", messageId: "m-v2", partId: "intro", part: { type: "text", text: "Hello" } },
      { schemaVersion: 2, id: "v2-3", threadId: "thread-1", timestamp: 3, type: "message.part.added", messageId: "m-v2", partId: "search", part: { type: "tool", toolCallId: "tool-1", name: "search", toolStatus: "pending" } },
      { schemaVersion: 2, id: "v2-4", threadId: "thread-1", timestamp: 4, type: "message.part.delta", messageId: "m-v2", partId: "intro", delta: " world" },
      { schemaVersion: 2, id: "v2-5", threadId: "thread-1", timestamp: 5, type: "tool.updated", messageId: "m-v2", partId: "search", toolCallId: "tool-1", name: "search", status: "complete", output: { count: 1 } }
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.messages["m-v2"]?.parts).toEqual([
      { id: "intro", type: "text", text: "Hello world", partStatus: "streaming" },
      { id: "search", type: "tool", toolCallId: "tool-1", name: "search", toolStatus: "complete", output: { count: 1 } }
    ]);
    expect(state.tools["tool-1"]).toMatchObject({ messageId: "m-v2", partId: "search", status: "complete" });
  });

  it("migrates v1 deltas to v2 addresses while retaining v1 reducer compatibility", () => {
    const v2 = migrateEventToV2({ ...base, id: "legacy-delta", type: "message.delta", messageId: "m1", delta: "Hello" });
    expect(v2).toMatchObject({ schemaVersion: 2, type: "message.part.delta", partId: "text:0" });
  });

  it("migrates v2 part events to the current v3 envelope", () => {
    const current = migrateEventToCurrent({ schemaVersion: 2, id: "v2-current", threadId: "thread-1", timestamp: 1, type: "message.completed", messageId: "m1" });
    expect(current).toMatchObject({ schemaVersion: 3, type: "message.completed", messageId: "m1" });
  });

  it("derives conversation lifecycle separately from message lifecycle", () => {
    const state = createStateFromMessages("thread-1", [{
      id: "m1", threadId: "thread-1", role: "assistant", status: "streaming", parts: [], createdAt: 1
    }]);
    expect(getConversationStatus(state)).toBe("streaming");
  });

  it("tracks ordered long-running task steps independently from transcript messages", () => {
    const events: AIFrontEvent[] = [
      { schemaVersion: 3, id: "task-1", threadId: "thread-1", timestamp: 1, type: "task.started", taskId: "research", title: "Research the market" },
      { schemaVersion: 3, id: "task-2", threadId: "thread-1", timestamp: 2, type: "task.step.updated", taskId: "research", step: { id: "sources", taskId: "research", title: "Collect sources", status: "running", progress: { current: 2, total: 5 } } },
      { schemaVersion: 3, id: "task-3", threadId: "thread-1", timestamp: 3, type: "task.step.updated", taskId: "research", step: { id: "sources", taskId: "research", title: "Collect sources", status: "complete", progress: { current: 5, total: 5 }, completedAt: 3 } },
      { schemaVersion: 3, id: "task-4", threadId: "thread-1", timestamp: 4, type: "task.updated", taskId: "research", status: "complete", progress: { current: 1, total: 1 } }
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.taskOrder).toEqual(["research"]);
    expect(state.tasks.research).toMatchObject({ status: "complete", completedAt: 4, stepOrder: ["sources"] });
    expect(state.tasks.research?.steps.sources).toMatchObject({ status: "complete", progress: { current: 5, total: 5 } });
  });

  it("clears stale terminal task and step fields when work resumes", () => {
    const events: AIFrontEvent[] = [
      { schemaVersion: 3, id: "start", threadId: "thread-1", timestamp: 1, type: "task.started", taskId: "retry", title: "Retry work" },
      { schemaVersion: 3, id: "step-failed", threadId: "thread-1", timestamp: 2, type: "task.step.updated", taskId: "retry", step: { id: "work", taskId: "retry", title: "Work", status: "failed", completedAt: 2, error: "Temporary failure" } },
      { schemaVersion: 3, id: "task-failed", threadId: "thread-1", timestamp: 3, type: "task.updated", taskId: "retry", status: "failed", error: "Temporary failure" },
      { schemaVersion: 3, id: "task-running", threadId: "thread-1", timestamp: 4, type: "task.updated", taskId: "retry", status: "running" },
      { schemaVersion: 3, id: "step-running", threadId: "thread-1", timestamp: 5, type: "task.step.updated", taskId: "retry", step: { id: "work", taskId: "retry", title: "Work", status: "running" } }
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.tasks.retry).not.toHaveProperty("completedAt");
    expect(state.tasks.retry).not.toHaveProperty("error");
    expect(state.tasks.retry?.steps.work).not.toHaveProperty("completedAt");
    expect(state.tasks.retry?.steps.work).not.toHaveProperty("error");
  });

  it("rejects invalid task progress and steps for unknown tasks", () => {
    expect(() => reduceEvent(createInitialState("thread-1"), {
      schemaVersion: 3, id: "task-invalid", threadId: "thread-1", timestamp: 1,
      type: "task.updated", taskId: "missing", status: "running", progress: { current: 2, total: 1 }
    })).toThrow(/Progress total/);
    expect(() => reduceEvent(createInitialState("thread-1"), {
      schemaVersion: 3, id: "step-invalid", threadId: "thread-1", timestamp: 1,
      type: "task.step.updated", taskId: "missing", step: { id: "s1", taskId: "missing", title: "Unknown", status: "running" }
    })).toThrow(/unknown task/);
  });

  it("tracks reconnect, offline and recovered connection transitions", () => {
    const events: AIFrontEvent[] = [
      { schemaVersion: 3, id: "connection-1", threadId: "thread-1", timestamp: 10, type: "connection.changed", status: "reconnecting", attempt: 1, nextRetryAt: 20, reason: "Transport closed" },
      { schemaVersion: 3, id: "connection-2", threadId: "thread-1", timestamp: 20, type: "connection.changed", status: "offline", attempt: 1, reason: "Browser offline" },
      { schemaVersion: 3, id: "connection-3", threadId: "thread-1", timestamp: 30, type: "connection.changed", status: "failed", attempt: 2, error: "Retries exhausted" },
      { schemaVersion: 3, id: "connection-4", threadId: "thread-1", timestamp: 40, type: "connection.changed", status: "connected" }
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.connection).toEqual({ status: "connected", attempt: 0, updatedAt: 40 });
  });

  it("clears stale connection fields and ignores out-of-order transitions", () => {
    const current = reduceEvent(createInitialState("thread-1"), {
      schemaVersion: 3, id: "connection-current", threadId: "thread-1", timestamp: 20,
      type: "connection.changed", status: "reconnecting", attempt: 3, nextRetryAt: 30, reason: "Temporary loss"
    });
    const stale = reduceEvent(current, {
      schemaVersion: 3, id: "connection-stale", threadId: "thread-1", timestamp: 10,
      type: "connection.changed", status: "offline", reason: "Old browser signal"
    });
    expect(stale.connection).toEqual(current.connection);
    expect(stale).toBe(current);

    const failed = reduceEvent(current, {
      schemaVersion: 3, id: "connection-failed", threadId: "thread-1", timestamp: 40,
      type: "connection.changed", status: "failed", attempt: 4, error: "Retries exhausted"
    });
    expect(failed.connection).toEqual({ status: "failed", attempt: 4, updatedAt: 40, error: "Retries exhausted" });
  });

  it("rejects unsafe connection event payloads", () => {
    expect(() => reduceEvent(createInitialState("thread-1"), {
      schemaVersion: 3, id: "connection-invalid", threadId: "thread-1", timestamp: 1,
      type: "connection.changed", status: "reconnecting", attempt: -1
    })).toThrow(/non-negative integer/);
    expect(() => reduceEvent(createInitialState("thread-1"), {
      schemaVersion: 3, id: "connection-failed", threadId: "thread-1", timestamp: 1,
      type: "connection.changed", status: "failed"
    })).toThrow(/requires an error/);
  });
});
