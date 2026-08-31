import type { AgentCheckpoint, ConnectionState, TaskStatus } from "@aifrontkit/core";
import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  CheckpointRecoveryFixture,
  checkpointRecoveryQualityScenarios,
  type CheckpointRecoveryFixtureId,
} from "../../../../../registry/react/css/patterns/checkpoint-recovery/checkpoint-recovery.fixture.js";

interface CheckpointRecoveryPlaygroundProps extends PlaygroundRecord {
  scenario: CheckpointRecoveryFixtureId;
}

const version = "1.0.0";
const currentTaskVersion = 7;
const defaults: PlaygroundState<CheckpointRecoveryPlaygroundProps, PlaygroundEnvironment> = {
  props: { scenario: "paused-latest" },
  environment: { ...environmentDefaults },
};

function codeState(scenario: CheckpointRecoveryFixtureId): {
  taskStatus: TaskStatus;
  checkpoints: readonly AgentCheckpoint[];
  connection: ConnectionState;
  operation: Record<string, unknown>;
} {
  const base: AgentCheckpoint = {
    id: "checkpoint-latest",
    version: 2,
    sequence: 12,
    kind: "interruption",
    title: "Sources collected and compared",
    summary: "Continue from the comparison milestone.",
    status: "available",
    restorable: true,
    createdAt: 1768555800000,
    updatedAt: 1768555800000,
    sourceTaskId: "research-task",
    sourceTaskVersion: currentTaskVersion,
    completedStepIds: ["collect", "compare"],
  };
  const connected: ConnectionState = { status: "connected", attempt: 0, updatedAt: 1768555800000 };
  if (scenario === "running-protected") return { taskStatus: "running", checkpoints: [base], connection: connected, operation: { status: "idle" } };
  if (scenario === "offline-safe") return { taskStatus: "paused", checkpoints: [base], connection: { status: "offline", attempt: 1, updatedAt: 1768555800000 }, operation: { status: "idle" } };
  if (scenario === "reconnecting") return { taskStatus: "failed", checkpoints: [base], connection: { status: "reconnecting", attempt: 2, updatedAt: 1768555800000 }, operation: { status: "idle" } };
  if (scenario === "stale-version") return { taskStatus: "failed", checkpoints: [{ ...base, sourceTaskVersion: 6, title: "Saved before the instructions changed" }], connection: connected, operation: { status: "idle" } };
  if (scenario === "expired-only") return { taskStatus: "failed", checkpoints: [{ ...base, status: "expired", restorable: false, reason: "Retention window ended" }], connection: connected, operation: { status: "idle" } };
  if (scenario === "incompatible") return { taskStatus: "failed", checkpoints: [{ ...base, status: "incompatible", restorable: false, reason: "Workflow format is no longer supported" }], connection: connected, operation: { status: "idle" } };
  if (scenario === "restoring") return { taskStatus: "failed", checkpoints: [base], connection: connected, operation: { status: "pending", action: "restore", checkpointId: base.id } };
  if (scenario === "restore-failed") return { taskStatus: "failed", checkpoints: [base], connection: connected, operation: { status: "failed", action: "restore", checkpointId: base.id, error: "The saved point could not be loaded." } };
  if (scenario === "complete-history") return { taskStatus: "complete", checkpoints: [base], connection: connected, operation: { status: "idle" } };
  if (scenario === "restart-confirmation") return { taskStatus: "cancelled", checkpoints: [base], connection: connected, operation: { status: "idle" } };
  return { taskStatus: scenario === "paused-direct-resume" ? "paused" : "failed", checkpoints: [base], connection: connected, operation: { status: "idle" } };
}

function scenarioLabel(id: string) {
  return id.split("-").map((word) => word[0]!.toUpperCase() + word.slice(1)).join(" ");
}

export const checkpointRecoveryPlayground = definePlayground<CheckpointRecoveryPlaygroundProps>({
  id: "checkpoint-recovery",
  version,
  label: "Checkpoint recovery",
  description: "Inspect version-bound restore, restart, connection gating and durable read-only history without adopting a workflow backend.",
  defaults,
  scenarios: checkpointRecoveryQualityScenarios.map((scenario) => ({
    id: scenario.id,
    version,
    label: scenarioLabel(scenario.id),
    description: scenario.expectation,
    values: scenario.id === defaults.props.scenario ? {} : { props: { scenario: scenario.id } },
    testId: `checkpoint-recovery-${scenario.id}`,
  })),
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <CheckpointRecoveryFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => {
    const typed = state.environment.language === "tsx";
    const initial = codeState(state.props.scenario);
    return [
      'import { useState } from "react";',
      ...(typed ? ['import type { AgentCheckpoint, AgentTask, ConnectionState } from "@aifrontkit/core";', 'import type { CheckpointRecoveryOperation } from "@/components/aifrontkit/checkpoint-recovery";'] : []),
      'import { CheckpointRecovery } from "@/components/aifrontkit/checkpoint-recovery";',
      "",
      `const task${typed ? ": AgentTask" : ""} = ${JSON.stringify({ id: "research-task", threadId: "research-thread", title: "Research product expansion risks", status: initial.taskStatus, stepOrder: ["collect", "compare"], steps: { collect: { id: "collect", taskId: "research-task", title: "Collect sources", status: "complete" }, compare: { id: "compare", taskId: "research-task", title: "Compare evidence", status: initial.taskStatus === "complete" ? "complete" : "pending" } } }, null, 2)};`,
      `const initialCheckpoints${typed ? ": readonly AgentCheckpoint[]" : ""} = ${JSON.stringify(initial.checkpoints, null, 2)};`,
      `const connection${typed ? ": ConnectionState" : ""} = ${JSON.stringify(initial.connection, null, 2)};`,
      "",
      "export function ResumableAgentWork() {",
      `  const [operation, setOperation] = useState${typed ? "<CheckpointRecoveryOperation>" : ""}(${JSON.stringify(initial.operation)});`,
      "  const [selectedCheckpointId, setSelectedCheckpointId] = useState();",
      "",
      "  return (",
      "    <CheckpointRecovery",
      "      task={task}",
      `      currentTaskVersion={${currentTaskVersion}}`,
      "      checkpoints={initialCheckpoints}",
      "      connection={connection}",
      "      operation={operation}",
      "      selectedCheckpointId={selectedCheckpointId}",
      "      onSelectedCheckpointChange={setSelectedCheckpointId}",
      "      onRestoreCheckpoint={(intent) => setOperation({ status: \"pending\", action: \"restore\", checkpointId: intent.checkpointId })}",
      "      onResumeTask={() => setOperation({ status: \"pending\", action: \"resume\" })}",
      "      onRestartTask={() => setOperation({ status: \"pending\", action: \"restart\" })}",
      "    />",
      "  );",
      "}",
    ].join("\n");
  },
});
