import type { Approval } from "@aifrontkit/core";
import { ToolApproval } from "./tool-approval.js";

export type ToolApprovalFixtureId = Approval["status"];

export const toolApprovalQualityScenarios: readonly {
  id: ToolApprovalFixtureId;
  expectation: string;
}[] = [
  { id: "requested", expectation: "Explains the consequential action before presenting approve and reject choices." },
  { id: "approved", expectation: "Communicates the completed decision and prevents duplicate actions." },
  { id: "rejected", expectation: "Communicates rejection and prevents duplicate actions." },
  { id: "expired", expectation: "Makes the stale request explicit and prevents an invalid decision." },
];

export function ToolApprovalFixture({ scenario, emit }: { scenario: ToolApprovalFixtureId; emit?(message: string): void }) {
  const approval: Approval = {
    id: `publish-approval-${scenario}`,
    toolCallId: "publish-release",
    summary: "Publish version 1.0.0 to the public registry.",
    status: scenario,
  };
  return (
    <div className="aifk-tool-approval-fixture" data-fixture-pattern="tool-approval" data-fixture-scenario={scenario}>
      <ToolApproval
        approval={approval}
        target="registry.aifrontkit.dev"
        reversible={false}
        onApprove={() => emit?.("onApprove()")}
        onReject={() => emit?.("onReject()")}
      />
    </div>
  );
}
