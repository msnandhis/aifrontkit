import type { AIFrontEvent } from "@aifrontkit/core";
import { describe, expect, it, vi } from "vitest";
import { createExternalStoreBridge } from "../src/index.js";

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
});

function taskProgressEvent(current: number): AIFrontEvent {
  return { schemaVersion: 3, id: `event-${current}`, threadId: "thread-1", timestamp: current, type: "task.updated", taskId: "run-1", status: "running", progress: { current, total: 2 } };
}
