import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AgentTask, Approval, Artifact, ConnectionState } from "@aifrontkit/core";
import type { AgentCheckpoint } from "@aifrontkit/core/checkpoint";
import * as CssAgentProgress from "../../../registry/react/css/patterns/agent-progress/agent-progress.js";
import * as TailwindAgentProgress from "../../../registry/react/tailwind/patterns/agent-progress/agent-progress.js";
import * as CssToolApproval from "../../../registry/react/css/patterns/tool-approval/tool-approval.js";
import * as TailwindToolApproval from "../../../registry/react/tailwind/patterns/tool-approval/tool-approval.js";
import * as CssArtifactReview from "../../../registry/react/css/patterns/artifact-review/artifact-review.js";
import * as TailwindArtifactReview from "../../../registry/react/tailwind/patterns/artifact-review/artifact-review.js";
import * as CssCheckpointRecovery from "../../../registry/react/css/patterns/checkpoint-recovery/checkpoint-recovery.js";
import * as TailwindCheckpointRecovery from "../../../registry/react/tailwind/patterns/checkpoint-recovery/checkpoint-recovery.js";
import * as CssAttachmentComposer from "../../../registry/react/css/patterns/attachment-composer/attachment-composer.js";
import * as TailwindAttachmentComposer from "../../../registry/react/tailwind/patterns/attachment-composer/attachment-composer.js";
import * as CssResearchAgent from "../../../registry/react/css/patterns/research-agent/research-agent.js";
import * as TailwindResearchAgent from "../../../registry/react/tailwind/patterns/research-agent/research-agent.js";

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2)
  ? (<Value>() => Value extends Right ? 1 : 2) extends (<Value>() => Value extends Left ? 1 : 2) ? true : false
  : false;
type Expect<Value extends true> = Value;

type ContractParity = [
  Expect<Equal<CssAgentProgress.AgentProgressProps, TailwindAgentProgress.AgentProgressProps>>,
  Expect<Equal<CssToolApproval.ToolApprovalProps, TailwindToolApproval.ToolApprovalProps>>,
  Expect<Equal<CssArtifactReview.ArtifactReviewProps, TailwindArtifactReview.ArtifactReviewProps>>,
  Expect<Equal<CssCheckpointRecovery.CheckpointRecoveryProps, TailwindCheckpointRecovery.CheckpointRecoveryProps>>,
  Expect<Equal<CssAttachmentComposer.AttachmentComposerProps, TailwindAttachmentComposer.AttachmentComposerProps>>,
  Expect<Equal<CssResearchAgent.ResearchAgentProps, TailwindResearchAgent.ResearchAgentProps>>,
];

const contractParity: ContractParity = [true, true, true, true, true, true];
const connection: ConnectionState = { status: "connected", attempt: 0, updatedAt: 1 };
const task: AgentTask = {
  id: "parity-task",
  threadId: "parity-thread",
  title: "Verify registry parity",
  status: "paused",
  stepOrder: ["compare"],
  steps: { compare: { id: "compare", taskId: "parity-task", title: "Compare semantic output", status: "pending" } },
};
const approval: Approval = {
  id: "parity-approval",
  toolCallId: "parity-tool",
  summary: "Confirm the parity action.",
  status: "requested",
};
const artifact: Artifact = {
  id: "parity-artifact",
  title: "Parity patch",
  kind: "code-diff",
  version: 1,
  status: "ready",
  updatedAt: 1,
  content: { format: "unified-diff" },
  review: { version: 1, status: "requested", updatedAt: 1 },
};
const change: CssArtifactReview.ArtifactChange = {
  path: "src/parity.ts",
  summary: "Keep the public semantic structure identical.",
  additions: 1,
  deletions: 0,
  lines: [{ kind: "addition", newLine: 1, content: "export const parity = true;" }],
};
const checkpoint: AgentCheckpoint = {
  id: "parity-checkpoint",
  version: 1,
  sequence: 1,
  kind: "manual",
  title: "Parity checkpoint",
  status: "available",
  restorable: true,
  createdAt: 1,
  updatedAt: 1,
  sourceTaskId: task.id,
  sourceTaskVersion: 1,
  completedStepIds: [],
};

function semanticMarkup(markup: string) {
  return markup.replaceAll(/ class="[^"]*"/g, "");
}

const fixtures = [
  {
    name: "agent progress",
    css: <CssAgentProgress.AgentProgress task={task} />,
    tailwind: <TailwindAgentProgress.AgentProgress task={task} />,
  },
  {
    name: "tool approval",
    css: <CssToolApproval.ToolApproval approval={approval} target="example.com" reversible onApprove={() => {}} onReject={() => {}} />,
    tailwind: <TailwindToolApproval.ToolApproval approval={approval} target="example.com" reversible onApprove={() => {}} onReject={() => {}} />,
  },
  {
    name: "artifact review",
    css: <CssArtifactReview.ArtifactReview artifact={artifact} change={change} />,
    tailwind: <TailwindArtifactReview.ArtifactReview artifact={artifact} change={change} />,
  },
  {
    name: "checkpoint recovery",
    css: <CssCheckpointRecovery.CheckpointRecovery task={task} currentTaskVersion={1} checkpoints={[checkpoint]} operation={{ status: "idle" }} />,
    tailwind: <TailwindCheckpointRecovery.CheckpointRecovery task={task} currentTaskVersion={1} checkpoints={[checkpoint]} operation={{ status: "idle" }} />,
  },
  {
    name: "attachment composer",
    css: <CssAttachmentComposer.AttachmentComposer attachments={[]} connection={connection} onSubmit={() => {}} />,
    tailwind: <TailwindAttachmentComposer.AttachmentComposer attachments={[]} connection={connection} onSubmit={() => {}} />,
  },
  {
    name: "research agent",
    css: <CssResearchAgent.ResearchAgent stage="complete" onStageChange={() => {}} />,
    tailwind: <TailwindResearchAgent.ResearchAgent stage="complete" onStageChange={() => {}} />,
  },
] as const;

describe("production pattern registry flavor parity", () => {
  it("keeps all public prop contracts equal", () => {
    expect(contractParity).toEqual([true, true, true, true, true, true]);
  });

  it.each(fixtures)("keeps semantic DOM parity for $name", ({ css, tailwind }) => {
    expect(semanticMarkup(renderToStaticMarkup(tailwind))).toBe(semanticMarkup(renderToStaticMarkup(css)));
  });
});
