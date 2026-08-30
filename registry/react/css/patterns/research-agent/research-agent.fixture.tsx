"use client";

import { useEffect, useState } from "react";
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

export function ResearchAgentFixture({ scenario, emit }: { scenario: ResearchAgentFixtureId; emit?(message: string): void }) {
  const [stage, setStage] = useState<ResearchAgentStage>(initialStage[scenario]);

  useEffect(() => setStage(initialStage[scenario]), [scenario]);

  return (
    <ResearchAgent
      stage={stage}
      scenario={scenario}
      onStageChange={(next, event) => {
        emit?.(event);
        setStage(next);
      }}
    />
  );
}
