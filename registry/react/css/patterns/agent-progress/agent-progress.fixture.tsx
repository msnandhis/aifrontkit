import type { AgentTask, TaskStatus } from "@aifrontkit/core";
import { AgentProgress } from "./agent-progress.js";

export type AgentProgressFixtureId = "running" | "awaiting-approval" | "paused" | "complete" | "failed";

export const agentProgressQualityScenarios: readonly {
  id: AgentProgressFixtureId;
  expectation: string;
}[] = [
  { id: "running", expectation: "Shows determinate task and step progress with a reachable stop action." },
  { id: "awaiting-approval", expectation: "Makes the blocked state explicit without implying that work is still advancing." },
  { id: "paused", expectation: "Offers a single clear resume action for recoverable work." },
  { id: "complete", expectation: "Preserves the completed step history without showing active controls." },
  { id: "failed", expectation: "Associates the failure reason with the task and offers recovery." },
];

const statusFor = (scenario: AgentProgressFixtureId): TaskStatus => scenario;

function taskFor(scenario: AgentProgressFixtureId): AgentTask {
  const status = statusFor(scenario);
  const terminal = status === "complete" || status === "failed";
  return {
    id: `release-audit-${scenario}`,
    threadId: "agent-progress-fixture",
    title: "Audit release readiness",
    status,
    stepOrder: ["contracts", "accessibility", "evidence"],
    steps: {
      contracts: {
        id: "contracts",
        taskId: `release-audit-${scenario}`,
        title: "Validate public contracts",
        status: "complete",
        progress: { current: 18, total: 18, label: "18 checks" },
      },
      accessibility: {
        id: "accessibility",
        taskId: `release-audit-${scenario}`,
        title: "Scan interaction states",
        status: status === "failed" ? "failed" : terminal ? "complete" : status === "running" ? "running" : "pending",
        ...(status === "running" ? { progress: { current: 7, total: 12, label: "7 of 12 states" } } : {}),
        ...(status === "failed" ? { error: "The approval control lost its visible focus indicator." } : {}),
      },
      evidence: {
        id: "evidence",
        taskId: `release-audit-${scenario}`,
        title: "Capture browser evidence",
        status: terminal && status === "complete" ? "complete" : "pending",
      },
    },
    progress: status === "complete" ? { current: 3, total: 3, label: "Complete" } : { current: status === "running" ? 2 : 1, total: 3, label: status },
    ...(status === "failed" ? { error: "Accessibility review needs attention before release." } : {}),
  };
}

export function AgentProgressFixture({ scenario, emit }: { scenario: AgentProgressFixtureId; emit?(message: string): void }) {
  const task = taskFor(scenario);
  return (
    <div data-fixture-pattern="agent-progress" data-fixture-scenario={scenario}>
      <h2 className="sr-only">Agent task preview</h2>
      <AgentProgress
        task={task}
        {...(scenario === "running" ? { onStop: () => emit?.("onStop()") } : {})}
        {...(scenario === "paused" || scenario === "failed" ? { onResume: () => emit?.("onResume()") } : {})}
      />
    </div>
  );
}
