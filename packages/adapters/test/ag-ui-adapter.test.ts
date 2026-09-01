import { describe, expect, it } from "vitest";
import { createAGUIAdapter } from "../src/ag-ui/index.js";

describe("AG-UI adapter", () => {
  it("normalizes the text start/content/end lifecycle", () => {
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => 1 });
    const events = [
      ...adapter.adapt({ type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" }),
      ...adapter.adapt({ type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Hello" }),
      ...adapter.adapt({ type: "TEXT_MESSAGE_END", messageId: "m1" })
    ];
    expect(events.map((event) => event.type)).toEqual(["message.started", "message.part.added", "message.part.delta", "message.part.status", "message.completed"]);
    expect(events.every((event) => event.schemaVersion === 4)).toBe(true);
  });

  it("assembles streamed tool arguments", () => {
    const adapter = createAGUIAdapter({ threadId: "t1" });
    adapter.adapt({ type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "search" });
    adapter.adapt({ type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "{\"q\":" });
    const [event] = adapter.adapt({ type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "\"docs\"}" });
    expect(event?.type === "tool.updated" && event.input).toEqual({ q: "docs" });
  });

  it("maps run and step lifecycle to long-running task state", () => {
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => 10, taskTitle: () => "Deep research" });
    const events = [
      ...adapter.adapt({ type: "RUN_STARTED", runId: "run-1" }),
      ...adapter.adapt({ type: "STEP_STARTED", stepName: "Collect sources" }),
      ...adapter.adapt({ type: "STEP_FINISHED", stepName: "Collect sources" }),
      ...adapter.adapt({ type: "RUN_FINISHED", runId: "run-1" })
    ];
    expect(events.map((event) => event.type)).toEqual(["task.started", "task.step.updated", "task.step.updated", "task.updated"]);
    expect(events[0]).toMatchObject({ taskId: "run-1", title: "Deep research" });
  });

  it("uses one timestamp for an event envelope and its task payload", () => {
    let timestamp = 0;
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => ++timestamp });
    adapter.adapt({ type: "RUN_STARTED", runId: "run-1" });
    const [event] = adapter.adapt({ type: "STEP_STARTED", stepName: "Search" });
    expect(event?.type === "task.step.updated" && event.timestamp).toBe(event?.type === "task.step.updated" ? event.step.startedAt : undefined);
  });

  it("assigns fresh identities when a run repeats a step name", () => {
    const adapter = createAGUIAdapter({ threadId: "t1" });
    adapter.adapt({ type: "RUN_STARTED", runId: "run-1" });
    const [first] = adapter.adapt({ type: "STEP_STARTED", stepName: "Search" });
    adapter.adapt({ type: "STEP_FINISHED", stepName: "Search" });
    const [second] = adapter.adapt({ type: "STEP_STARTED", stepName: "Search" });
    expect(first?.type === "task.step.updated" && second?.type === "task.step.updated" && first.step.id).not.toBe(second?.type === "task.step.updated" ? second.step.id : undefined);
  });

  it("preserves tool input streaming before execution starts", () => {
    const adapter = createAGUIAdapter({ threadId: "t1" });
    adapter.adapt({ type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "search", parentMessageId: "m1" });
    const [streaming] = adapter.adapt({ type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "{\"q\":\"docs\"}" });
    const [running] = adapter.adapt({ type: "TOOL_CALL_END", toolCallId: "c1" });
    expect(streaming).toMatchObject({ type: "tool.updated", status: "input-streaming", messageId: "m1", partId: "tool:c1" });
    expect(running).toMatchObject({ type: "tool.updated", status: "running" });
    const [result] = adapter.adapt({ type: "TOOL_CALL_RESULT", toolCallId: "c1", messageId: "tool-result-message", content: { count: 1 } });
    expect(result).toMatchObject({ type: "tool.updated", status: "complete", messageId: "m1", partId: "tool:c1" });
  });

  it("completes every active step before a run finishes", () => {
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => 20 });
    adapter.adapt({ type: "RUN_STARTED", runId: "run-1" });
    adapter.adapt({ type: "STEP_STARTED", stepName: "Search" });
    adapter.adapt({ type: "STEP_STARTED", stepName: "Compose" });
    const events = adapter.adapt({ type: "RUN_FINISHED", runId: "run-1" });
    expect(events.map((event) => event.type === "task.step.updated" ? [event.step.title, event.step.status] : [event.type, event.type === "task.updated" ? event.status : undefined])).toEqual([
      ["Search", "complete"],
      ["Compose", "complete"],
      ["task.updated", "complete"]
    ]);
  });

  it("fails every active step before a run error terminates the task", () => {
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => 30 });
    adapter.adapt({ type: "RUN_STARTED", runId: "run-1" });
    adapter.adapt({ type: "STEP_STARTED", stepName: "Search" });
    const events = adapter.adapt({ type: "RUN_ERROR", message: "upstream unavailable", code: "TEMPORARY" });
    expect(events[0]).toMatchObject({ type: "task.step.updated", step: { title: "Search", status: "failed", error: "upstream unavailable" } });
    expect(events[1]).toMatchObject({ type: "task.updated", status: "failed", error: "upstream unavailable" });
  });

  it("does not treat AG-UI frontend state synchronization as a durable checkpoint", () => {
    const adapter = createAGUIAdapter({ threadId: "t1" });
    expect(adapter.adapt({ type: "STATE_SNAPSHOT", snapshot: { durable: false, private: "state" } })).toEqual([]);
    expect(adapter.adapt({ type: "STATE_DELTA", delta: [{ op: "replace", path: "/private", value: "state" }] })).toEqual([]);
  });
});
