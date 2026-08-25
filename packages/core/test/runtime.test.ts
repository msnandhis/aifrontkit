import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { createRuntime, reduceEvent, createInitialState, type AIFrontEvent } from "../src/index.js";

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
});
