"use client";

import { useEffect, useRef, useState } from "react";
import type { AgentCheckpoint, AgentCheckpointStatus } from "@aifrontkit/core/checkpoint";
import type { AgentTask, ConnectionState, TaskStatus } from "@aifrontkit/core";
import { CheckpointRecovery, type CheckpointRecoveryOperation } from "./checkpoint-recovery.js";

export type CheckpointRecoveryFixtureId =
  | "running-protected"
  | "paused-latest"
  | "paused-direct-resume"
  | "older-confirmation"
  | "restoring"
  | "restore-failed"
  | "offline-safe"
  | "reconnecting"
  | "stale-version"
  | "expired-only"
  | "incompatible"
  | "restart-confirmation"
  | "complete-history"
  | "long-history";

export const checkpointRecoveryQualityScenarios: readonly {
  id: CheckpointRecoveryFixtureId;
  expectation: string;
}[] = [
  { id: "running-protected", expectation: "Keeps the latest saved point quiet and read-only while current agent work is active." },
  { id: "paused-latest", expectation: "Offers the newest compatible saved point as the single recovery primary action." },
  { id: "paused-direct-resume", expectation: "Ranks direct task resume above checkpoint restore without showing two filled actions." },
  { id: "older-confirmation", expectation: "Requires an alertdialog confirmation before restoring an intentionally selected older point." },
  { id: "restoring", expectation: "Shows controlled pending recovery without optimistically changing checkpoint evidence." },
  { id: "restore-failed", expectation: "Retains selection and saved evidence, then focuses one shared recovery error." },
  { id: "offline-safe", expectation: "Preserves the selection and history while one shared offline notice disables remote actions." },
  { id: "reconnecting", expectation: "Explains that recovery stays paused and never restores automatically after reconnect." },
  { id: "stale-version", expectation: "Explains that a saved point belongs to an earlier task version and does not offer restore." },
  { id: "expired-only", expectation: "Keeps expired evidence readable while clearly removing recovery capability." },
  { id: "incompatible", expectation: "Surfaces a normalized compatibility reason without exposing provider state." },
  { id: "restart-confirmation", expectation: "Requires confirmation before starting a new run and focuses Cancel first." },
  { id: "complete-history", expectation: "Treats completed work as read-only history with only a confirmed run-again path." },
  { id: "long-history", expectation: "Contains exactly six mixed-state points, a long label, Arabic and Japanese text and an indeterminate task step without overflow." },
];

const taskVersion = 7;
const baseTime = Date.UTC(2026, 0, 16, 9, 30);
const connected: ConnectionState = { status: "connected", attempt: 0, updatedAt: baseTime };

function task(status: TaskStatus, long = false): AgentTask {
  return {
    id: "research-task",
    threadId: "research-thread",
    title: long ? "Cross-market research synthesis" : "Research product expansion risks",
    status,
    stepOrder: ["collect", "compare", "write"],
    steps: {
      collect: { id: "collect", taskId: "research-task", title: "Collect sources", status: "complete" },
      compare: {
        id: "compare",
        taskId: "research-task",
        title: "قارن الأدلة مع ملاحظات فريق 東京",
        status: long ? "running" : status === "complete" ? "complete" : "pending",
        ...(long ? { progress: { current: 4, label: "Reviewing regional evidence" } } : {}),
      },
      write: { id: "write", taskId: "research-task", title: "Write recommendation", status: status === "complete" ? "complete" : "pending" },
    },
  };
}

function checkpoint(
  id: string,
  sequence: number,
  title: string,
  status: AgentCheckpointStatus = "available",
  overrides: Partial<AgentCheckpoint> = {},
): AgentCheckpoint {
  return {
    id,
    version: 2,
    sequence,
    kind: "automatic",
    title,
    status,
    restorable: status === "available",
    createdAt: baseTime - (12 - sequence) * 15 * 60_000,
    updatedAt: baseTime - (12 - sequence) * 15 * 60_000,
    sourceTaskId: "research-task",
    sourceTaskVersion: taskVersion,
    completedStepIds: ["collect"],
    ...overrides,
  };
}

const latest = checkpoint("latest", 12, "Sources collected and compared", "available", {
  kind: "interruption",
  summary: "The evidence set is complete. Drafting can continue from the comparison milestone.",
  completedStepIds: ["collect", "compare"],
});
const older = checkpoint("older", 8, "Primary sources collected", "available", {
  kind: "manual",
  summary: "Resume before regional evidence was compared.",
});

function fixtureState(scenario: CheckpointRecoveryFixtureId): {
  task: AgentTask;
  checkpoints: readonly AgentCheckpoint[];
  connection: ConnectionState;
  operation: CheckpointRecoveryOperation;
  defaultSelectedCheckpointId?: string;
  directResume?: boolean;
  restart?: boolean;
} {
  if (scenario === "running-protected") return { task: task("running"), checkpoints: [latest, older], connection: connected, operation: { status: "idle" } };
  if (scenario === "paused-latest") return { task: task("paused"), checkpoints: [older, latest], connection: connected, operation: { status: "idle" } };
  if (scenario === "paused-direct-resume") return { task: task("paused"), checkpoints: [latest, older], connection: connected, operation: { status: "idle" }, directResume: true };
  if (scenario === "older-confirmation") return { task: task("failed"), checkpoints: [latest, older], connection: connected, operation: { status: "idle" }, defaultSelectedCheckpointId: older.id };
  if (scenario === "restoring") return { task: task("failed"), checkpoints: [latest, older], connection: connected, operation: { status: "pending", action: "restore", checkpointId: latest.id } };
  if (scenario === "restore-failed") return { task: task("failed"), checkpoints: [latest, older], connection: connected, operation: { status: "failed", action: "restore", checkpointId: latest.id, error: "The saved point could not be loaded. Check the connection and try again." } };
  if (scenario === "offline-safe") return { task: task("paused"), checkpoints: [latest, older], connection: { status: "offline", attempt: 1, updatedAt: baseTime, reason: "Network unavailable" }, operation: { status: "idle" }, directResume: true };
  if (scenario === "reconnecting") return { task: task("failed"), checkpoints: [latest, older], connection: { status: "reconnecting", attempt: 2, updatedAt: baseTime, nextRetryAt: baseTime + 5_000 }, operation: { status: "idle" } };
  if (scenario === "stale-version") return {
    task: task("failed"),
    checkpoints: [checkpoint("stale", 11, "Analysis before the task instructions changed", "available", { sourceTaskVersion: 6, summary: "This save targets task version 6." })],
    connection: connected,
    operation: { status: "idle" },
  };
  if (scenario === "expired-only") return {
    task: task("failed"),
    checkpoints: [checkpoint("expired", 7, "Temporary recovery point", "expired", { restorable: false, expiresAt: baseTime - 60_000, reason: "Retention window ended" })],
    connection: connected,
    operation: { status: "idle" },
  };
  if (scenario === "incompatible") return {
    task: task("failed"),
    checkpoints: [checkpoint("incompatible", 9, "Saved with an earlier workflow", "incompatible", { restorable: false, reason: "This saved point uses a workflow format this app cannot restore." })],
    connection: connected,
    operation: { status: "idle" },
  };
  if (scenario === "restart-confirmation") return { task: task("cancelled"), checkpoints: [latest], connection: connected, operation: { status: "idle" }, restart: true };
  if (scenario === "complete-history") return { task: task("complete"), checkpoints: [latest, older], connection: connected, operation: { status: "idle" }, restart: true };
  return {
    task: task("failed", true),
    checkpoints: [
      checkpoint("long-latest", 18, "International enterprise research, accessibility findings, regional constraints and evidence reconciliation for final review", "available", { kind: "interruption", completedStepIds: ["collect", "compare"] }),
      checkpoint("long-japanese", 16, "東京チームの調査結果を統合", "available", { kind: "manual" }),
      checkpoint("long-arabic", 15, "حفظ قبل مراجعة الأدلة الإقليمية", "restored", { restorable: false, kind: "approval-boundary" }),
      checkpoint("long-expired", 12, "Competitor evidence collected", "expired", { restorable: false, expiresAt: baseTime - 30_000 }),
      checkpoint("long-incompatible", 9, "Legacy workflow snapshot", "incompatible", { restorable: false, reason: "Workflow format is no longer supported" }),
      checkpoint("long-failed", 6, "Initial collection attempt", "failed", { restorable: false, error: "The browser closed before this save completed." }),
    ],
    connection: connected,
    operation: { status: "idle" },
    restart: true,
  };
}

export function CheckpointRecoveryFixture({ scenario, emit }: { scenario: CheckpointRecoveryFixtureId; emit?(message: string): void }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const initial = fixtureState(scenario);
  const [operation, setOperation] = useState<CheckpointRecoveryOperation>(initial.operation);
  const [connection, setConnection] = useState(initial.connection);
  const [selectedCheckpointId, setSelectedCheckpointId] = useState(initial.defaultSelectedCheckpointId);
  const [restoreCallCount, setRestoreCallCount] = useState(0);

  useEffect(() => {
    const next = fixtureState(scenario);
    setOperation(next.operation);
    setConnection(next.connection);
    setSelectedCheckpointId(next.defaultSelectedCheckpointId);
    setRestoreCallCount(0);
  }, [scenario]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const frame = requestAnimationFrame(() => {
      if (scenario === "older-confirmation") root.querySelector<HTMLButtonElement>("[data-action='restore']")?.click();
      if (scenario === "restart-confirmation") root.querySelector<HTMLButtonElement>("[data-action='restart']")?.click();
      if (scenario === "long-history") root.querySelector<HTMLButtonElement>("[data-action='toggle-history']")?.click();
    });
    return () => cancelAnimationFrame(frame);
  }, [scenario]);

  const state = fixtureState(scenario);
  return (
    <div ref={rootRef} data-fixture-pattern="checkpoint-recovery" data-fixture-scenario={scenario} data-fixture-restore-count={restoreCallCount}>
      <CheckpointRecovery
        key={scenario}
        task={state.task}
        currentTaskVersion={taskVersion}
        checkpoints={state.checkpoints}
        connection={connection}
        operation={operation}
        {...(selectedCheckpointId ? { selectedCheckpointId } : {})}
        {...(state.defaultSelectedCheckpointId ? { defaultSelectedCheckpointId: state.defaultSelectedCheckpointId } : {})}
        onSelectedCheckpointChange={(checkpointId) => {
          emit?.(`onSelectedCheckpointChange(${checkpointId})`);
          setSelectedCheckpointId(checkpointId);
        }}
        onRestoreCheckpoint={(intent) => {
          setRestoreCallCount((count) => count + 1);
          emit?.(`onRestoreCheckpoint(${intent.checkpointId}, ${intent.checkpointVersion})`);
          setOperation({ status: "pending", action: "restore", checkpointId: intent.checkpointId });
        }}
        {...(state.directResume ? {
          onResumeTask: (taskId: string) => {
            emit?.(`onResumeTask(${taskId})`);
            setOperation({ status: "pending", action: "resume" });
          },
        } : {})}
        {...(state.restart ? {
          onRestartTask: (intent) => {
            emit?.(`onRestartTask(${intent.taskId}, ${intent.expectedTaskVersion})`);
            setOperation({ status: "pending", action: "restart" });
          },
        } : {})}
        onRetryConnection={() => {
          emit?.("onRetryConnection()");
          setConnection((current) => ({ ...current, status: "reconnecting", updatedAt: current.updatedAt + 1 }));
        }}
        formatTimestamp={(_timestamp, checkpointValue) => `Jan 16, ${String(9 + Math.floor(checkpointValue.sequence / 4)).padStart(2, "0")}:30`}
      />
    </div>
  );
}
