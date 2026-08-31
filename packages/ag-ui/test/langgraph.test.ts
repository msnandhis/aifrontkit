import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createLangGraphAdapter, projectLangGraphCheckpointHistory, type LangGraphStateSnapshot, type LangGraphStreamChunk } from "../src/index.js";

interface CompatibilityFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  chunks: LangGraphStreamChunk[];
  expectedTypes: string[];
}

const fixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/langgraph-1.4.13/stream-modes.json", import.meta.url), "utf8")) as CompatibilityFixture;
const minimumFixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/langgraph-1.0.0/stream-modes.json", import.meta.url), "utf8")) as CompatibilityFixture;

interface CheckpointHistoryFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  snapshots: LangGraphStateSnapshot[];
}

const checkpointFixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/langgraph-1.4.13/checkpoint-history.json", import.meta.url), "utf8")) as CheckpointHistoryFixture;

describe(`LangGraph ${fixture.upstream.version} reference adapter`, () => {
  it("pins the reviewed package and protocol", () => {
    expect(fixture).toMatchObject({ fixtureSchemaVersion: 1 });
    expect(fixture.upstream).toEqual({ package: "@langchain/langgraph", version: "1.4.13", protocol: "streamMode tuples", capturedAt: "2026-08-30", source: "https://docs.langchain.com/oss/javascript/langgraph/streaming" });
  });

  it("maps pinned stream modes including a repeated node and concurrent same-name tools", () => {
    const adapter = createLangGraphAdapter({ threadId: "thread-1", runId: "run-1", now: () => 10 });
    const events = [...adapter.start(), ...fixture.chunks.flatMap((chunk) => adapter.adapt(chunk)), ...adapter.finish()];
    expect(events.map((event) => event.type)).toEqual(fixture.expectedTypes);
    expect(events.every((event) => event.schemaVersion === 4)).toBe(true);

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

  it("pins the reviewed getStateHistory StateSnapshot shape", () => {
    expect(checkpointFixture).toMatchObject({ fixtureSchemaVersion: 1 });
    expect(checkpointFixture.upstream).toEqual({
      package: "@langchain/langgraph",
      version: "1.4.13",
      protocol: "getStateHistory StateSnapshot entries",
      capturedAt: "2026-08-31",
      source: "https://docs.langchain.com/oss/javascript/langgraph/persistence"
    });
    expect(checkpointFixture.snapshots[0]).toMatchObject({
      config: { configurable: { thread_id: expect.any(String), checkpoint_id: expect.any(String), checkpoint_ns: expect.any(String) } },
      metadata: { source: "loop", writes: expect.any(Object), step: 7 },
      createdAt: expect.any(String),
      next: expect.any(Array),
      parentConfig: expect.any(Object),
      tasks: expect.any(Array),
      values: expect.any(Object)
    });
  });

  it("projects only curated public checkpoints with stable reviewed step order", () => {
    const [first, second, third] = checkpointFixture.snapshots;
    if (!first || !second || !third) throw new Error("Checkpoint fixture is incomplete.");
    const events = projectLangGraphCheckpointHistory({
      threadId: "public-thread-1",
      candidates: [
        {
          snapshot: third,
          id: "public-approval",
          version: 3,
          kind: "approval-boundary",
          title: "Review approved",
          summary: "Continue from the reviewed draft.",
          decision: { compatibility: "compatible", status: "available", restorable: true },
          sourceTaskId: "research-run",
          sourceTaskVersion: 4
        },
        {
          snapshot: second,
          id: "public-draft",
          version: 2,
          kind: "automatic",
          title: "Draft composed",
          decision: { compatibility: "incompatible", status: "incompatible", restorable: false, reason: "Graph inputs changed." }
        }
      ]
    });

    expect(events).toHaveLength(2);
    expect(events.map((event) => event.type === "checkpoint.updated" ? event.checkpoint.id : undefined)).toEqual(["public-approval", "public-draft"]);
    expect(events.map((event) => event.type === "checkpoint.updated" ? event.checkpoint.sequence : undefined)).toEqual([8, 8]);
    expect(events[0]).toMatchObject({
      schemaVersion: 4,
      threadId: "public-thread-1",
      timestamp: Date.parse("2026-08-30T09:31:30+00:00"),
      checkpoint: { sourceTaskId: "research-run", sourceTaskVersion: 4, status: "available", restorable: true }
    });
    expect(events[1]).toMatchObject({ checkpoint: { status: "incompatible", restorable: false, reason: "Graph inputs changed." } });
  });

  it("never exposes raw graph state, writes, tasks or provider persistence handles", () => {
    const snapshot = checkpointFixture.snapshots[0];
    if (!snapshot) throw new Error("Checkpoint fixture is incomplete.");
    const before = structuredClone(snapshot);
    const output = projectLangGraphCheckpointHistory({
      threadId: "public-thread-1",
      candidates: [{
        snapshot,
        id: "public-checkpoint-7",
        version: 1,
        kind: "automatic",
        title: "Research collected",
        decision: { compatibility: "compatible", status: "available", restorable: true }
      }]
    });
    const serialized = JSON.stringify(output);
    for (const forbidden of [
      "Private research brief",
      "must-not-leak",
      "privateNotes",
      "provider-thread-91",
      "provider-checkpoint-7",
      "research-graph",
      "provider-task-7",
      "checkpoint_id",
      "checkpoint_ns",
      "values",
      "writes",
      "tasks"
    ]) {
      expect(serialized).not.toContain(forbidden);
    }
    expect(snapshot).toEqual(before);
  });

  it("fails clearly when public identity, version or timestamp evidence is invalid", () => {
    const base: LangGraphStateSnapshot = { metadata: { step: 1 }, createdAt: "2026-08-30T09:30:00.000Z" };
    const project = (snapshot: LangGraphStateSnapshot, id: string, version: number) => projectLangGraphCheckpointHistory({
      threadId: "public-thread-1",
      candidates: [{ snapshot, id, version, kind: "manual", title: "Saved point", decision: { compatibility: "compatible", status: "available", restorable: true } }]
    });
    expect(() => project(base, "", 1)).toThrow("candidates[0].id must be a non-empty string");
    expect(() => project(base, "public-id", 0)).toThrow("candidates[0].version must be a positive integer");
    expect(() => project({ metadata: { step: 1 } }, "public-id", 1)).toThrow("snapshot.createdAt must be an ISO 8601 timestamp");
    expect(() => project({ metadata: { step: 1 }, createdAt: "not-a-date" }, "public-id", 1)).toThrow("snapshot.createdAt must be an ISO 8601 timestamp");
    expect(() => project({ metadata: { step: 1 }, createdAt: "2026-02-31T09:30:00.000Z" }, "public-id", 1)).toThrow("snapshot.createdAt must be a valid timestamp");
  });

  it("rejects duplicate public identities and restorable superseded decisions", () => {
    const snapshot: LangGraphStateSnapshot = { metadata: { step: 1 }, createdAt: "2026-08-30T09:30:00.000Z" };
    const candidate = {
      snapshot,
      id: "public-id",
      version: 1,
      kind: "automatic" as const,
      title: "Saved point",
      decision: { compatibility: "compatible" as const, status: "available" as const, restorable: true }
    };
    expect(() => projectLangGraphCheckpointHistory({ threadId: "thread-1", candidates: [candidate, candidate] })).toThrow("id must be unique");
    expect(() => projectLangGraphCheckpointHistory({
      threadId: "thread-1",
      candidates: [{ ...candidate, decision: { compatibility: "compatible", status: "superseded", restorable: true } }]
    })).toThrow("superseded checkpoint as non-restorable");
  });
});

describe(`LangGraph ${minimumFixture.upstream.version} compatibility floor`, () => {
  it("maps the pinned minimum stream tuple shapes", () => {
    expect(minimumFixture).toMatchObject({ fixtureSchemaVersion: 1, upstream: { package: "@langchain/langgraph", version: "1.0.0", protocol: "streamMode tuples" } });
    const adapter = createLangGraphAdapter({ threadId: "thread-min", runId: "run-min", now: () => 10 });
    const events = [...adapter.start(), ...minimumFixture.chunks.flatMap((chunk) => adapter.adapt(chunk)), ...adapter.finish()];
    expect(events.map((event) => event.type)).toEqual(minimumFixture.expectedTypes);
    expect(events.every((event) => event.schemaVersion === 4)).toBe(true);
  });
});
