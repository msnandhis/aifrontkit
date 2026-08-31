"use client";

import { useEffect, useState } from "react";
import type { AgentCheckpoint } from "@aifrontkit/core/checkpoint";
import type { CheckpointRecoveryOperation } from "../checkpoint-recovery/checkpoint-recovery.js";
import { ResearchAgent, type ResearchAgentStage } from "./research-agent.js";

export type ResearchAgentFixtureId = "walkthrough" | "awaiting-approval" | "offline" | "failed" | "complete";

export const researchAgentQualityScenarios: readonly {
  id: ResearchAgentFixtureId;
  expectation: string;
}[] = [
  { id: "walkthrough", expectation: "Runs the complete production-state walkthrough without a backend." },
  { id: "awaiting-approval", expectation: "Pauses consequential source access at an explicit approval boundary." },
  { id: "offline", expectation: "Preserves research progress while offline and offers an intentional retry." },
  { id: "failed", expectation: "Keeps successful evidence while isolating and recovering a failed source." },
  { id: "complete", expectation: "Presents the final answer with its attachment and source citations." },
];

const initialStage: Record<ResearchAgentFixtureId, ResearchAgentStage> = {
  walkthrough: "streaming",
  "awaiting-approval": "approval",
  offline: "offline",
  failed: "failed",
  complete: "complete",
};

const taskVersion = 7;
const checkpointTime = Date.UTC(2026, 0, 16, 9, 30);
const checkpoints: readonly AgentCheckpoint[] = [
  {
    id: "research-synthesis",
    version: 2,
    sequence: 12,
    kind: "interruption",
    title: "Source comparison complete",
    summary: "Six primary sources are retained. The recommendation can continue from synthesis.",
    status: "available",
    restorable: true,
    createdAt: checkpointTime,
    updatedAt: checkpointTime,
    sourceTaskId: "research-market-signals",
    sourceTaskVersion: taskVersion,
    completedStepIds: ["scope", "sources"],
  },
  {
    id: "research-sources",
    version: 2,
    sequence: 8,
    kind: "automatic",
    title: "Primary sources collected",
    status: "available",
    restorable: true,
    createdAt: checkpointTime - 30 * 60_000,
    updatedAt: checkpointTime - 30 * 60_000,
    sourceTaskId: "research-market-signals",
    sourceTaskVersion: taskVersion,
    completedStepIds: ["scope"],
  },
];

export function ResearchAgentFixture({ scenario, emit }: { scenario: ResearchAgentFixtureId; emit?(message: string): void }) {
  const [stage, setStage] = useState<ResearchAgentStage>(initialStage[scenario]);
  const [checkpointOperation, setCheckpointOperation] = useState<CheckpointRecoveryOperation>({ status: "idle" });
  const [selectedCheckpointId, setSelectedCheckpointId] = useState<string>();

  useEffect(() => {
    setStage(initialStage[scenario]);
    setCheckpointOperation({ status: "idle" });
    setSelectedCheckpointId(undefined);
  }, [scenario]);

  return (
    <ResearchAgent
      stage={stage}
      scenario={scenario}
      checkpointRecovery={{
        currentTaskVersion: taskVersion,
        checkpoints,
        operation: checkpointOperation,
        ...(selectedCheckpointId ? { selectedCheckpointId } : {}),
        onSelectedCheckpointChange: (checkpointId) => {
          emit?.(`checkpoint.select(${checkpointId})`);
          setSelectedCheckpointId(checkpointId);
        },
        onRestoreCheckpoint: (intent) => {
          emit?.(`checkpoint.restore(${intent.checkpointId}, ${intent.checkpointVersion})`);
          setCheckpointOperation({ status: "pending", action: "restore", checkpointId: intent.checkpointId });
        },
        ...(stage === "complete" ? {
          onRestartTask: (intent) => {
            emit?.(`checkpoint.restart(${intent.taskId}, ${intent.expectedTaskVersion})`);
            setCheckpointOperation({ status: "pending", action: "restart" });
          },
        } : {}),
        formatTimestamp: () => "Jan 16, 09:30",
      }}
      onStageChange={(next, event) => {
        emit?.(event);
        setStage(next);
      }}
    />
  );
}
