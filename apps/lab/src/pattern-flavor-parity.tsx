import type { AgentTask, Approval, Artifact, AttachmentUpload, ConnectionState } from "@aifrontkit/core";
import type { AgentCheckpoint } from "@aifrontkit/core/checkpoint";
import { ThemeProvider } from "@aifrontkit/react";
import type { ReactNode } from "react";
import { AgentProgress as CssAgentProgress } from "../../../registry/react/css/patterns/agent-progress/agent-progress.js";
import { ArtifactReview as CssArtifactReview, type ArtifactChange } from "../../../registry/react/css/patterns/artifact-review/artifact-review.js";
import { AttachmentComposer as CssAttachmentComposer } from "../../../registry/react/css/patterns/attachment-composer/attachment-composer.js";
import { CheckpointRecovery as CssCheckpointRecovery } from "../../../registry/react/css/patterns/checkpoint-recovery/checkpoint-recovery.js";
import { ResearchAgent as CssResearchAgent } from "../../../registry/react/css/patterns/research-agent/research-agent.js";
import { ToolApproval as CssToolApproval } from "../../../registry/react/css/patterns/tool-approval/tool-approval.js";
import { AgentProgress as TailwindAgentProgress } from "../../../registry/react/tailwind/patterns/agent-progress/agent-progress.js";
import { ArtifactReview as TailwindArtifactReview } from "../../../registry/react/tailwind/patterns/artifact-review/artifact-review.js";
import { AttachmentComposer as TailwindAttachmentComposer } from "../../../registry/react/tailwind/patterns/attachment-composer/attachment-composer.js";
import { CheckpointRecovery as TailwindCheckpointRecovery } from "../../../registry/react/tailwind/patterns/checkpoint-recovery/checkpoint-recovery.js";
import { ResearchAgent as TailwindResearchAgent } from "../../../registry/react/tailwind/patterns/research-agent/research-agent.js";
import { ToolApproval as TailwindToolApproval } from "../../../registry/react/tailwind/patterns/tool-approval/tool-approval.js";

const updatedAt = Date.UTC(2026, 0, 16, 9, 30);
const connection: ConnectionState = { status: "connected", attempt: 0, updatedAt };
const task: AgentTask = {
  id: "visual-parity-task",
  threadId: "visual-parity-thread",
  title: "Verify production pattern parity",
  status: "paused",
  stepOrder: ["contracts", "visuals", "accessibility"],
  steps: {
    contracts: { id: "contracts", taskId: "visual-parity-task", title: "Compare public contracts", status: "complete" },
    visuals: { id: "visuals", taskId: "visual-parity-task", title: "Compare visual geometry", status: "pending" },
    accessibility: { id: "accessibility", taskId: "visual-parity-task", title: "Run accessibility checks", status: "pending" },
  },
  progress: { current: 1, total: 3, label: "1 of 3 checks" },
};
const approval: Approval = {
  id: "visual-parity-approval",
  toolCallId: "publish-preview",
  summary: "Publish the verified preview to the public registry.",
  status: "requested",
};
const artifact: Artifact = {
  id: "visual-parity-artifact",
  title: "Registry parity patch",
  kind: "code-diff",
  version: 2,
  status: "ready",
  updatedAt,
  content: { format: "unified-diff" },
  review: { version: 2, status: "requested", updatedAt },
};
const change: ArtifactChange = {
  path: "src/pattern-parity.ts",
  summary: "Keep CSS Modules and Tailwind geometry aligned.",
  provenanceLabel: "Visual parity fixture",
  additions: 1,
  deletions: 1,
  lines: [
    { kind: "deletion", oldLine: 1, content: "export const parity = false;" },
    { kind: "addition", newLine: 1, content: "export const parity = true;" },
  ],
};
const checkpoint: AgentCheckpoint = {
  id: "visual-parity-checkpoint",
  version: 1,
  sequence: 1,
  kind: "manual",
  title: "Contract checks complete",
  summary: "Continue from the visual comparison step.",
  status: "available",
  restorable: true,
  createdAt: updatedAt,
  updatedAt,
  sourceTaskId: task.id,
  sourceTaskVersion: 1,
  completedStepIds: ["contracts"],
};
const attachments: readonly AttachmentUpload[] = [
  {
    id: "parity-brief",
    file: { type: "file", name: "parity-brief.pdf", mediaType: "application/pdf", size: 248_000 },
    status: "ready",
  },
];

const noop = () => {};

function FlavorSurface({ flavor, children }: { flavor: "css-modules" | "tailwind"; children: ReactNode }) {
  return (
    <article
      data-pattern-flavor={flavor}
      style={{ minInlineSize: 0, padding: 20, border: "1px solid #e4e4e7", borderRadius: 12, background: "#fff" }}
    >
      <div style={{ marginBlockEnd: 16, color: "#52525b", fontSize: 13, fontWeight: 650 }}>{flavor === "css-modules" ? "CSS Modules" : "Tailwind"}</div>
      <div data-pattern-render-root style={{ minInlineSize: 0 }}>{children}</div>
    </article>
  );
}

function PatternPair({ id, title, css, tailwind }: { id: string; title: string; css: ReactNode; tailwind: ReactNode }) {
  return (
    <section data-pattern-pair={id} aria-labelledby={`pattern-${id}`} style={{ minInlineSize: 0 }}>
      <h2 id={`pattern-${id}`} style={{ margin: "0 0 12px", color: "#18181b", fontSize: 18 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 30rem), 1fr))", gap: 16, alignItems: "start" }}>
        <FlavorSurface flavor="css-modules">{css}</FlavorSurface>
        <FlavorSurface flavor="tailwind">{tailwind}</FlavorSurface>
      </div>
    </section>
  );
}

export function PatternFlavorParity() {
  const checkpointProps = {
    task,
    currentTaskVersion: 1,
    checkpoints: [checkpoint],
    connection,
    operation: { status: "idle" as const },
    onRestoreCheckpoint: noop,
    formatTimestamp: () => "Jan 16, 09:30",
  };
  const attachmentProps = {
    attachments,
    connection,
    value: "Summarize the parity evidence.",
    onValueChange: noop,
    onRemove: noop,
    onSubmit: noop,
  };

  return (
    <ThemeProvider theme={{ mode: "light", density: "comfortable", radius: "medium", motion: { level: "none" } }}>
      <main
        data-flavor-parity="patterns"
        style={{ width: "min(100% - 32px, 1320px)", margin: "0 auto", paddingBlock: 32, display: "grid", gap: 36 }}
      >
        <header>
          <p style={{ margin: "0 0 6px", color: "#52525b", fontSize: 14 }}>Registry quality fixture</p>
          <h1 style={{ margin: 0, color: "#18181b", fontSize: 28, letterSpacing: "-0.02em" }}>Production pattern flavor parity</h1>
        </header>
        <PatternPair
          id="agent-progress"
          title="Agent progress"
          css={<CssAgentProgress task={task} onResume={noop} />}
          tailwind={<TailwindAgentProgress task={task} onResume={noop} />}
        />
        <PatternPair
          id="tool-approval"
          title="Tool approval"
          css={<CssToolApproval approval={approval} target="registry.aifrontkit.dev" reversible={false} headingLevel={3} onApprove={noop} onReject={noop} />}
          tailwind={<TailwindToolApproval approval={approval} target="registry.aifrontkit.dev" reversible={false} headingLevel={3} onApprove={noop} onReject={noop} />}
        />
        <PatternPair
          id="artifact-review"
          title="Artifact review"
          css={<CssArtifactReview artifact={artifact} change={change} onAccept={noop} onRequestChanges={noop} />}
          tailwind={<TailwindArtifactReview artifact={artifact} change={change} onAccept={noop} onRequestChanges={noop} />}
        />
        <PatternPair
          id="checkpoint-recovery"
          title="Checkpoint recovery"
          css={<CssCheckpointRecovery {...checkpointProps} />}
          tailwind={<TailwindCheckpointRecovery {...checkpointProps} />}
        />
        <PatternPair
          id="attachment-composer"
          title="Attachment composer"
          css={<CssAttachmentComposer {...attachmentProps} />}
          tailwind={<TailwindAttachmentComposer {...attachmentProps} />}
        />
        <PatternPair
          id="research-agent"
          title="Research agent"
          css={<CssResearchAgent stage="complete" onStageChange={noop} />}
          tailwind={<TailwindResearchAgent stage="complete" onStageChange={noop} />}
        />
      </main>
    </ThemeProvider>
  );
}
