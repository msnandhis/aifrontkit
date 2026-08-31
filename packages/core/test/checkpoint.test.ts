import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { assertEvent, createInitialState, isAIFrontEventV4, reduceEvent, type AIFrontEvent, type AIFrontEventV4, type AgentCheckpoint } from "../src/index.js";

function checkpoint(overrides: Partial<AgentCheckpoint> = {}): AgentCheckpoint {
  return {
    id: "checkpoint-1",
    version: 1,
    sequence: 1,
    kind: "automatic",
    title: "Sources collected",
    status: "available",
    restorable: true,
    createdAt: 10,
    updatedAt: 10,
    ...overrides
  };
}

function event(id: string, value: AgentCheckpoint): AIFrontEventV4 {
  return {
    schemaVersion: 4,
    id,
    threadId: "thread-1",
    timestamp: value.updatedAt,
    type: "checkpoint.updated",
    checkpoint: value
  };
}

describe("resumable agent checkpoint contract", () => {
  it("validates the full provider-neutral projection at the event boundary", () => {
    const valid = event("event-1", checkpoint({
      kind: "approval-boundary",
      summary: "The research draft is ready to review.",
      sourceTaskId: "research",
      sourceStepId: "draft",
      sourceTaskVersion: 2,
      expiresAt: 100,
      completedStepIds: ["sources", "draft"],
      metadata: { adapter: "reference" }
    }));
    expect(() => assertEvent(valid)).not.toThrow();
    expect(isAIFrontEventV4(valid)).toBe(true);
    expect(() => assertEvent(event("invalid-version", checkpoint({ version: 0 })))).toThrow(/positive integer/);
    expect(() => assertEvent(event("invalid-sequence", checkpoint({ sequence: -1 })))).toThrow(/non-negative integer/);
    expect(() => assertEvent(event("invalid-time", checkpoint({ updatedAt: 9 })))).toThrow(/earlier than createdAt/);
    expect(() => assertEvent(event("invalid-step", checkpoint({ completedStepIds: ["sources", "sources"] })))).toThrow(/unique/);
    expect(() => assertEvent({ ...valid, schemaVersion: 3 } as unknown)).toThrow(/schema version 4/);
  });

  it("tracks checkpoints separately from tasks without requiring a source task", () => {
    const state = reduceEvent(createInitialState("thread-1"), event("event-1", checkpoint({ sourceTaskId: "not-loaded" })));
    expect(state.tasks).toEqual({});
    expect(state.checkpointOrder).toEqual(["checkpoint-1"]);
    expect(state.checkpoints["checkpoint-1"]).toMatchObject({ sourceTaskId: "not-loaded", status: "available" });
  });

  it("orders latest sequence first and preserves first arrival for sequence ties", () => {
    const events: AIFrontEvent[] = [
      event("first", checkpoint({ id: "first", sequence: 4 })),
      event("older", checkpoint({ id: "older", sequence: 2 })),
      event("tie", checkpoint({ id: "tie", sequence: 4 })),
      event("latest", checkpoint({ id: "latest", sequence: 8 }))
    ];
    const state = events.reduce(reduceEvent, createInitialState("thread-1"));
    expect(state.checkpointOrder).toEqual(["latest", "first", "tie", "older"]);
  });

  it("accepts only a later snapshot for one stable checkpoint sequence", () => {
    const initial = reduceEvent(createInitialState("thread-1"), event("initial", checkpoint({ status: "available", updatedAt: 20 })));
    const older = reduceEvent(initial, event("older", checkpoint({ status: "failed", updatedAt: 19 })));
    const equal = reduceEvent(older, event("equal", checkpoint({ status: "failed", updatedAt: 20 })));
    const later = reduceEvent(equal, event("later", checkpoint({ status: "restoring", restorable: false, version: 2, updatedAt: 21 })));

    expect(older.checkpoints["checkpoint-1"]?.status).toBe("available");
    expect(older.processedEventIds.has("older")).toBe(true);
    expect(equal.checkpoints["checkpoint-1"]?.status).toBe("available");
    expect(equal.processedEventIds.has("equal")).toBe(true);
    expect(later.checkpoints["checkpoint-1"]).toMatchObject({ status: "restoring", restorable: false, version: 2, updatedAt: 21 });
    expect(later.checkpointOrder).toEqual(["checkpoint-1"]);
    expect(() => reduceEvent(later, event("changed-sequence", checkpoint({ sequence: 2, updatedAt: 22 })))).toThrow(/sequence cannot change/);
  });

  it("publishes an immutable v4 schema while retaining older schema files", () => {
    const schema = JSON.parse(readFileSync(new URL("../schemas/v4/event.schema.json", import.meta.url), "utf8")) as {
      properties: { schemaVersion: { const: number }; type: { enum: string[] }; checkpoint: { required: string[] } };
    };
    expect(schema.properties.schemaVersion.const).toBe(4);
    expect(schema.properties.type.enum).toContain("checkpoint.updated");
    expect(schema.properties.checkpoint.required).toEqual(expect.arrayContaining(["id", "version", "sequence", "title", "status", "restorable", "createdAt", "updatedAt"]));
    expect(JSON.parse(readFileSync(new URL("../schemas/v3/event.schema.json", import.meta.url), "utf8")).properties.schemaVersion.const).toBe(3);
  });
});
