import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createLangGraphAdapter, type LangGraphStreamChunk } from "../src/index.js";

interface CompatibilityFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  chunks: LangGraphStreamChunk[];
  expectedTypes: string[];
}

const fixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/langgraph-1.4.13/stream-modes.json", import.meta.url), "utf8")) as CompatibilityFixture;

describe(`LangGraph ${fixture.upstream.version} reference adapter`, () => {
  it("pins the reviewed package and protocol", () => {
    expect(fixture).toMatchObject({ fixtureSchemaVersion: 1 });
    expect(fixture.upstream).toEqual({ package: "@langchain/langgraph", version: "1.4.13", protocol: "streamMode tuples", capturedAt: "2026-08-30", source: "https://docs.langchain.com/oss/javascript/langgraph/streaming" });
  });

  it("maps pinned stream modes including a repeated node and concurrent same-name tools", () => {
    const adapter = createLangGraphAdapter({ threadId: "thread-1", runId: "run-1", now: () => 10 });
    const events = [...adapter.start(), ...fixture.chunks.flatMap((chunk) => adapter.adapt(chunk)), ...adapter.finish()];
    expect(events.map((event) => event.type)).toEqual(fixture.expectedTypes);

    const researchStarts = events.filter((event) => event.type === "task.step.updated" && event.step.status === "running");
    expect(researchStarts).toHaveLength(2);
    expect(researchStarts[0]?.type === "task.step.updated" && researchStarts[0].step.id).not.toBe(researchStarts[1]?.type === "task.step.updated" ? researchStarts[1].step.id : undefined);
    const toolEvents = events.filter((event) => event.type === "tool.updated");
    expect(toolEvents.map((event) => event.type === "tool.updated" ? event.toolCallId : undefined)).toEqual(["tool-1", "tool-2", "tool-1", "tool-2"]);
    expect(events).toContainEqual(expect.objectContaining({ type: "tool.updated", status: "failed", error: "temporary network failure" }));
  });

  it("reports a transient graph failure without completing the task", () => {
    const adapter = createLangGraphAdapter({ threadId: "thread-1", runId: "run-retry", now: () => 10 });
    const events = [
      ...adapter.start(),
      ...adapter.adapt(["messages", [{ id: "message-retry", content: "Partial" }, { langgraph_node: "answer" }]]),
      ...adapter.fail(new Error("checkpoint unavailable"))
    ];
    expect(events).toContainEqual(expect.objectContaining({ type: "message.part.status", status: "failed", error: "checkpoint unavailable" }));
    expect(events).toContainEqual(expect.objectContaining({ type: "message.failed", error: "checkpoint unavailable" }));
    const terminalStepIndex = events.findIndex((event) => event.type === "task.step.updated" && event.step.status === "failed");
    const terminalTaskIndex = events.findIndex((event) => event.type === "task.updated" && event.status === "failed");
    expect(terminalStepIndex).toBeGreaterThan(-1);
    expect(terminalStepIndex).toBeLessThan(terminalTaskIndex);
    expect(events.at(-1)).toMatchObject({ type: "task.updated", status: "failed", error: "checkpoint unavailable" });
  });

  it("completes every still-running node before the task finishes", () => {
    const adapter = createLangGraphAdapter({ threadId: "thread-1", runId: "run-terminal", now: () => 10 });
    adapter.start();
    adapter.adapt(["messages", [{ id: "message-1", content: "Working" }, { langgraph_node: "research" }]]);
    adapter.adapt(["messages", [{ id: "message-2", content: "Working" }, { langgraph_node: "compose" }]]);
    const events = adapter.finish();
    const terminalSteps = events.filter((event) => event.type === "task.step.updated");
    expect(terminalSteps.map((event) => event.type === "task.step.updated" ? [event.step.title, event.step.status] : [])).toEqual([["research", "complete"], ["compose", "complete"]]);
    expect(events.at(-1)).toMatchObject({ type: "task.updated", status: "complete" });
  });
});
