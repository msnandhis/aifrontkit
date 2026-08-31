import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  ResearchAgentFixture,
  type ResearchAgentFixtureId,
} from "../../../../../registry/react/css/patterns/research-agent/research-agent.fixture.js";

interface ResearchAgentProps extends PlaygroundRecord {
  scenario: ResearchAgentFixtureId;
}

const version = "1.0.0";
const defaults: PlaygroundState<ResearchAgentProps, PlaygroundEnvironment> = {
  props: { scenario: "walkthrough" },
  environment: { ...environmentDefaults },
};

export const researchAgentPlayground = definePlayground<ResearchAgentProps>({
  id: "research-agent",
  version,
  label: "Research agent",
  description: "Walk through streaming, approval, offline recovery, failure and cited completion in one frontend pattern.",
  defaults,
  scenarios: [
    { id: "walkthrough", version, label: "Walkthrough", description: "Begin with streaming and use the interface to traverse every state.", values: {}, testId: "research-agent-walkthrough" },
    { id: "awaiting-approval", version, label: "Approval", description: "Pause external source access at an explicit decision boundary.", values: { props: { scenario: "awaiting-approval" } }, testId: "research-agent-approval" },
    { id: "offline", version, label: "Offline", description: "Preserve progress while the transport is unavailable.", values: { props: { scenario: "offline" } }, testId: "research-agent-offline" },
    { id: "failed", version, label: "Failed", description: "Isolate a failed source while keeping completed work.", values: { props: { scenario: "failed" } }, testId: "research-agent-failed" },
    { id: "complete", version, label: "Complete", description: "Present the final result, attachment and source evidence.", values: { props: { scenario: "complete" } }, testId: "research-agent-complete" },
  ],
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <ResearchAgentFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => [
    'import { useState } from "react";',
    'import { ResearchAgent } from "@/components/aifrontkit/research-agent";',
    "",
    "export function ResearchWorkspace() {",
    `  const [stage, setStage] = useState("${state.props.scenario === "walkthrough" ? "streaming" : state.props.scenario === "awaiting-approval" ? "approval" : state.props.scenario}");`,
    "",
    "  return (",
    "    <ResearchAgent",
    "      stage={stage}",
    "      onStageChange={(next) => setStage(next)}",
    "    />",
    "  );",
    "}",
  ].join("\n"),
});
