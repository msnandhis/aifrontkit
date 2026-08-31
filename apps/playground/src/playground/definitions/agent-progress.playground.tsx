import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  AgentProgressFixture,
  type AgentProgressFixtureId,
} from "../../../../../registry/react/css/patterns/agent-progress/agent-progress.fixture.js";

interface AgentProgressProps extends PlaygroundRecord {
  scenario: AgentProgressFixtureId;
}

const version = "1.0.0";
const defaults: PlaygroundState<AgentProgressProps, PlaygroundEnvironment> = {
  props: { scenario: "running" },
  environment: { ...environmentDefaults },
};

export const agentProgressPlayground = definePlayground<AgentProgressProps>({
  id: "agent-progress",
  version,
  label: "Agent progress",
  description: "Inspect long-running task progress, blocked work, recovery and terminal states.",
  defaults,
  scenarios: [
    { id: "running", version, label: "Running", description: "Active task and step progress with stop intent.", values: {}, testId: "agent-progress-running" },
    { id: "awaiting-approval", version, label: "Awaiting approval", description: "Work is blocked at a consequential decision.", values: { props: { scenario: "awaiting-approval" } }, testId: "agent-progress-awaiting-approval" },
    { id: "paused", version, label: "Paused", description: "Recoverable work exposes one resume action.", values: { props: { scenario: "paused" } }, testId: "agent-progress-paused" },
    { id: "complete", version, label: "Complete", description: "Completed history remains visible without active controls.", values: { props: { scenario: "complete" } }, testId: "agent-progress-complete" },
    { id: "failed", version, label: "Failed", description: "Failure context remains attached to the task with recovery.", values: { props: { scenario: "failed" } }, testId: "agent-progress-failed" },
  ],
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <AgentProgressFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => [
    'import { AgentProgress } from "@/components/aifrontkit/agent-progress";',
    "",
    "export function ReleaseAudit({ task, stop, resume }) {",
    `  // Preview state: ${state.props.scenario}`,
    "  return <AgentProgress task={task} onStop={stop} onResume={resume} />;",
    "}",
  ].join("\n"),
});
