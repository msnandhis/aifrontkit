import type { AIFrontEvent } from "@aifrontkit/core";
import { describe, expect, it, vi } from "vitest";
import { createExternalStoreBridge, projectLangGraphCheckpointHistory, type LangGraphStateSnapshot } from "../src/index.js";

describe("external store bridge", () => {
  it("projects snapshots once per store notification and disposes cleanly", () => {
    let snapshot = 0;
    let listener: (() => void) | undefined;
    const dispose = vi.fn();
    const emit = vi.fn();
    const bridge = createExternalStoreBridge({
      store: {
        getSnapshot: () => snapshot,
        subscribe: (next) => {
          listener = next;
          return dispose;
        }
      },
      project: (next, previous) => previous === undefined || next === previous ? [] : [taskProgressEvent(next)],
      emit
    });

    bridge.connect();
    expect(bridge.connected).toBe(true);
    snapshot = 1;
    listener?.();
    expect(emit).toHaveBeenCalledWith([expect.objectContaining({ type: "task.updated", progress: { current: 1, total: 2 } })]);

    bridge.disconnect();
    bridge.disconnect();
    expect(bridge.connected).toBe(false);
    expect(dispose).toHaveBeenCalledOnce();
  });

  it("publishes v4 checkpoint events without a provider runtime dependency", () => {
    let listener: (() => void) | undefined;
    let snapshot: LangGraphStateSnapshot = {
      metadata: { source: "loop", step: 2 },
      createdAt: "2026-08-30T09:30:00.000Z"
    };
    const emitted: AIFrontEvent[][] = [];
    const bridge = createExternalStoreBridge({
      store: {
        getSnapshot: () => snapshot,
        subscribe: (next) => {
          listener = next;
          return () => undefined;
        }
      },
      project: (next, previous) => previous === undefined || next === previous ? [] : projectLangGraphCheckpointHistory({
        threadId: "thread-1",
        candidates: [{
          snapshot: next,
          id: "public-checkpoint-2",
          version: 1,
          kind: "automatic",
          title: "Research gathered",
          decision: { compatibility: "compatible", status: "available", restorable: true }
        }]
      }),
      emit: (events) => emitted.push([...events])
    });

    bridge.connect();
    snapshot = { metadata: { source: "loop", step: 3 }, createdAt: "2026-08-30T09:31:00.000Z" };
    listener?.();
    expect(emitted[0]?.[0]).toMatchObject({ schemaVersion: 4, type: "checkpoint.updated", checkpoint: { id: "public-checkpoint-2", sequence: 3 } });
  });
});

function taskProgressEvent(current: number): AIFrontEvent {
  return { schemaVersion: 4, id: `event-${current}`, threadId: "thread-1", timestamp: current, type: "task.updated", taskId: "run-1", status: "running", progress: { current, total: 2 } };
}
