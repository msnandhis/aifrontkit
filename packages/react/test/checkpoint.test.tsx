import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createRuntime, type AgentCheckpoint, type ConnectionState, type TaskStatus } from "@aifrontkit/core";
import {
  AIFrontKitProvider,
  CheckpointPrimitive,
  createCheckpointRestoreIntent,
  isCheckpointRestoreAvailable,
  type CheckpointRestoreOperation
} from "../src/index.js";

const checkpoint: AgentCheckpoint = {
  id: "checkpoint-1",
  version: 3,
  sequence: 8,
  kind: "interruption",
  title: "Research paused",
  status: "available",
  restorable: true,
  createdAt: Date.UTC(2026, 7, 31, 9, 30),
  updatedAt: Date.UTC(2026, 7, 31, 9, 31),
  expiresAt: Date.UTC(2026, 8, 7, 9, 30),
  summary: "Five sources collected and two remain.",
  sourceTaskId: "task-1",
  sourceTaskVersion: 4
};

function renderRestore(overrides: {
  checkpoint?: AgentCheckpoint;
  currentTaskVersion?: number;
  taskStatus?: TaskStatus;
  connection?: ConnectionState;
  operation?: CheckpointRestoreOperation;
  callback?: boolean;
} = {}) {
  return renderToStaticMarkup(
    <CheckpointPrimitive.Root
      checkpoint={overrides.checkpoint ?? checkpoint}
      currentTaskVersion={overrides.currentTaskVersion ?? 4}
      taskStatus={overrides.taskStatus ?? "paused"}
      connection={overrides.connection ?? { status: "connected", attempt: 0, updatedAt: 1 }}
      {...(overrides.operation === undefined ? {} : { operation: overrides.operation })}
      {...(overrides.callback === false ? {} : { onRestore: () => undefined })}
    >
      <CheckpointPrimitive.Restore disabled={false} />
    </CheckpointPrimitive.Root>
  );
}

describe("CheckpointPrimitive", () => {
  it("renders controlled semantic slots without adding a row live region", () => {
    const html = renderToStaticMarkup(
      <CheckpointPrimitive.Root checkpoint={checkpoint} currentTaskVersion={4} taskStatus="paused" onRestore={() => undefined}>
        <CheckpointPrimitive.Title as="h2" />
        <CheckpointPrimitive.Kind />
        <CheckpointPrimitive.Status />
        <CheckpointPrimitive.Summary />
        <CheckpointPrimitive.CreatedAt format={(timestamp) => `Created ${timestamp}`} />
        <CheckpointPrimitive.Expiry format={(timestamp) => `Expires ${timestamp}`} />
        <CheckpointPrimitive.Error />
        <CheckpointPrimitive.Restore type="submit" className="restore-action" aria-label="Restore saved work" />
      </CheckpointPrimitive.Root>
    );

    expect(html).toContain('aria-label="Checkpoint: Research paused"');
    expect(html).toContain('data-aifk-checkpoint=""');
    expect(html).toContain('data-status="available"');
    expect(html).toContain('data-kind="interruption"');
    expect(html).toContain('data-restorable="true"');
    expect(html).toContain('<h2 data-aifk-checkpoint-title="">Research paused</h2>');
    expect(html).toContain('data-aifk-checkpoint-kind=""');
    expect(html).toContain('data-aifk-checkpoint-status=""');
    expect(html).toContain("Five sources collected and two remain.");
    expect(html).toContain('data-aifk-checkpoint-created-at=""');
    expect(html).toContain('dateTime="2026-08-31T09:30:00.000Z"');
    expect(html).toContain(`Created ${checkpoint.createdAt}`);
    expect(html).toContain(`Expires ${checkpoint.expiresAt}`);
    expect(html).not.toContain('role="status"');
    expect(html).not.toContain('aria-live=');
    expect(html).not.toContain('data-aifk-checkpoint-error');
    expect(html).not.toContain('disabled=""');
    expect(html).toContain('type="button"');
    expect(html).toContain('class="restore-action"');
    expect(html).toContain('aria-label="Restore saved work"');
  });

  it("renders native time defaults and omits optional slots without values", () => {
    const { summary: _summary, expiresAt: _expiresAt, ...checkpointWithoutOptionalSlots } = checkpoint;
    const html = renderToStaticMarkup(
      <CheckpointPrimitive.Root checkpoint={checkpointWithoutOptionalSlots}>
        <CheckpointPrimitive.Summary />
        <CheckpointPrimitive.CreatedAt />
        <CheckpointPrimitive.Expiry />
      </CheckpointPrimitive.Root>
    );
    expect(html).toContain("<time");
    expect(html).not.toContain('data-aifk-checkpoint-summary');
    expect(html).not.toContain('data-aifk-checkpoint-expiry');
  });

  it("fails closed for stale, unavailable, active, disconnected, pending and callback-free restores", () => {
    const cases = [
      renderRestore({ currentTaskVersion: 5 }),
      renderRestore({ checkpoint: { ...checkpoint, restorable: false } }),
      renderRestore({ checkpoint: { ...checkpoint, status: "expired" } }),
      renderRestore({ checkpoint: { ...checkpoint, status: "incompatible" } }),
      renderRestore({ checkpoint: { ...checkpoint, status: "superseded" } }),
      renderRestore({ checkpoint: { ...checkpoint, status: "restored" } }),
      renderRestore({ checkpoint: { ...checkpoint, status: "failed" } }),
      renderRestore({ taskStatus: "queued" }),
      renderRestore({ taskStatus: "running" }),
      renderRestore({ taskStatus: "awaiting-approval" }),
      renderRestore({ taskStatus: "complete" }),
      renderRestore({ connection: { status: "offline", attempt: 1, updatedAt: 2 } }),
      renderRestore({ connection: { status: "reconnecting", attempt: 2, updatedAt: 3 } }),
      renderRestore({ operation: { status: "pending" } }),
      renderRestore({ callback: false })
    ];
    for (const html of cases) expect(html).toContain('disabled=""');
    expect(cases[0]).toContain('data-stale="true"');
    expect(cases[13]).toContain('aria-busy="true"');
  });

  it("preserves exact restore identity and versions without inventing missing source data", () => {
    expect(createCheckpointRestoreIntent(checkpoint, 4)).toEqual({
      checkpointId: "checkpoint-1",
      checkpointVersion: 3,
      sourceTaskId: "task-1",
      sourceTaskVersion: 4,
      currentTaskVersion: 4
    });
    const { sourceTaskId: _sourceTaskId, sourceTaskVersion: _sourceTaskVersion, ...checkpointWithoutSource } = checkpoint;
    expect(createCheckpointRestoreIntent(checkpointWithoutSource)).toEqual({ checkpointId: "checkpoint-1", checkpointVersion: 3 });
  });

  it("exposes deterministic availability for composed patterns", () => {
    expect(isCheckpointRestoreAvailable({ checkpoint, currentTaskVersion: 4, taskStatus: "paused", hasRestoreCallback: true })).toBe(true);
    expect(isCheckpointRestoreAvailable({ checkpoint, currentTaskVersion: 4, taskStatus: "complete", hasRestoreCallback: true })).toBe(false);
    expect(isCheckpointRestoreAvailable({ checkpoint, currentTaskVersion: 4, locallyPending: true, hasRestoreCallback: true })).toBe(false);
  });

  it("renders only controlled or checkpoint errors", () => {
    const operationFailure = renderToStaticMarkup(
      <CheckpointPrimitive.Root checkpoint={checkpoint} operation={{ status: "failed", error: "Restore was rejected." }}>
        <CheckpointPrimitive.Error />
      </CheckpointPrimitive.Root>
    );
    const checkpointFailure = renderToStaticMarkup(
      <CheckpointPrimitive.Root checkpoint={{ ...checkpoint, error: "Checkpoint data is incomplete." }}>
        <CheckpointPrimitive.Error />
      </CheckpointPrimitive.Root>
    );
    expect(operationFailure).toContain('role="alert"');
    expect(operationFailure).toContain("Restore was rejected.");
    expect(checkpointFailure).toContain("Checkpoint data is incomplete.");
  });

  it("resolves runtime checkpoints and reports a clear missing ID", () => {
    const runtime = createRuntime("thread-1", [{
      schemaVersion: 4,
      id: "checkpoint-event",
      threadId: "thread-1",
      timestamp: checkpoint.updatedAt,
      type: "checkpoint.updated",
      checkpoint
    }]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <CheckpointPrimitive.Root checkpointId="checkpoint-1">
          <CheckpointPrimitive.Title />
        </CheckpointPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain("Research paused");
    expect(() => renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <CheckpointPrimitive.Root checkpointId="missing" />
      </AIFrontKitProvider>
    )).toThrow('CheckpointPrimitive.Root could not find checkpoint "missing" in runtime state.');
  });
});
