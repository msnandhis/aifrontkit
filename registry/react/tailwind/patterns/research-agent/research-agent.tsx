"use client";

import { useEffect, useRef } from "react";
import type { AgentTask, Approval, ConnectionState, FileContentPart, ToolCall } from "@aifrontkit/core";
import { ConnectionPrimitive } from "@aifrontkit/react";
import { ToolPrimitive } from "@aifrontkit/react/tool";
import { File } from "../../components/file/file.js";
import { AgentProgress } from "../agent-progress/agent-progress.js";
import { CheckpointRecovery, type CheckpointRecoveryProps } from "../checkpoint-recovery/checkpoint-recovery.js";
import { ToolApproval } from "../tool-approval/tool-approval.js";

const classNames: Record<string, string> = {
  "research-agent": "research-agent grid w-full gap-[var(--aifk-space-4,1rem)] border-y border-[var(--aifk-border-strong,ButtonBorder)] bg-transparent p-[clamp(1rem,3vw,1.5rem)] text-[var(--aifk-text,CanvasText)] [&_h2]:m-0 [&_h3]:m-0 [&_p]:m-0 [&_button]:min-h-[max(2.75rem,var(--aifk-space-touch-target,2.75rem))] [&_button]:font-[inherit] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--aifk-focus,Highlight)] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-2 [&_a:focus-visible]:outline-[var(--aifk-focus,Highlight)] motion-reduce:[&_*]:duration-[0.01ms]! motion-reduce:[&_*]:scroll-auto",
  "research-agent__header": "research-agent__header flex items-center justify-between gap-[var(--aifk-space-3,0.75rem)] max-[36rem]:grid max-[36rem]:grid-cols-1",
  "research-agent__eyebrow": "research-agent__eyebrow text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-bold uppercase tracking-[0.08em] text-[var(--aifk-accent,Highlight)]",
  "research-agent__run-status": "research-agent__run-status shrink-0 py-[0.3rem] text-[length:var(--aifk-type-font-size-xs,0.75rem)] text-[var(--aifk-text-muted,GrayText)] before:me-[0.4rem] before:inline-block before:size-[0.4rem] before:rounded-full data-[active=false]:before:hidden data-[active=true]:before:bg-[var(--aifk-accent,Highlight)] max-[36rem]:justify-self-start",
  "research-agent__stage-status": "research-agent__stage-status border border-transparent bg-transparent py-[0.55rem] text-[length:var(--aifk-type-font-size-xs,0.75rem)] text-[var(--aifk-text-muted,GrayText)] focus:border-[var(--aifk-focus,Highlight)] focus:outline-2 focus:outline-offset-2 focus:outline-[var(--aifk-focus,Highlight)]",
  "research-agent__connection": "research-agent__connection flex items-center gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent py-[0.65rem] data-[status=offline]:border-[color-mix(in_srgb,var(--aifk-destructive,CanvasText)_38%,var(--aifk-border,ButtonBorder))] data-[status=offline]:bg-[color-mix(in_srgb,var(--aifk-destructive,CanvasText)_7%,transparent)] data-[status=offline]:px-[0.8rem] data-[status=reconnecting]:bg-[var(--aifk-accent-muted,Canvas)] data-[status=reconnecting]:px-[0.8rem] [&>div]:grid [&>div]:min-w-0 [&_p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_button]:ms-auto [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-medium,0.625rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-canvas,Canvas)] [&_button]:px-[0.8rem] [&_button]:text-[var(--aifk-text,CanvasText)] max-[36rem]:flex-wrap max-[36rem]:items-start max-[36rem]:[&_button]:ms-0 max-[36rem]:[&_button]:w-full",
  "research-agent__connection-dot": "research-agent__connection-dot size-[0.55rem] rounded-full bg-[var(--aifk-success,CanvasText)] group-data-[status=offline]:bg-[var(--aifk-destructive,CanvasText)] group-data-[status=reconnecting]:bg-[var(--aifk-accent,Highlight)]",
  "research-agent__brief": "research-agent__brief grid grid-cols-[auto_minmax(0,1fr)] gap-[var(--aifk-space-3,0.75rem)] bg-transparent py-[var(--aifk-space-4,1rem)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-3,0.75rem)] [&_h3]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:leading-[1.6] [&_p]:text-[var(--aifk-text-muted,GrayText)]",
  "research-agent__avatar": "research-agent__avatar grid size-8 place-items-center rounded-[var(--aifk-radius-medium,0.625rem)] bg-[var(--aifk-accent,Highlight)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[750] text-[var(--aifk-accent-contrast,HighlightText)]",
  "research-agent__response": "research-agent__response grid gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent py-[var(--aifk-space-4,1rem)] [&>p]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&>p]:leading-[1.6] [&>p]:text-[var(--aifk-text-muted,GrayText)]",
  "research-agent__response-heading": "research-agent__response-heading flex items-center gap-[var(--aifk-space-3,0.75rem)] [&>div]:grid [&_h3]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_span]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_span]:text-[var(--aifk-text-muted,GrayText)]",
  "research-agent__spark": "research-agent__spark grid size-8 place-items-center rounded-[var(--aifk-radius-medium,0.625rem)] bg-[var(--aifk-accent-muted,Canvas)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[750] text-[var(--aifk-accent,Highlight)]",
  "research-agent__cursor": "research-agent__cursor text-[var(--aifk-accent,Highlight)]",
  "research-agent__primary": "research-agent__primary justify-self-start rounded-[var(--aifk-radius-medium,0.625rem)] border-0 bg-[var(--aifk-accent,Highlight)] px-4 text-[var(--aifk-accent-contrast,HighlightText)] cursor-pointer",
  "research-agent__work-grid": "research-agent__work-grid grid grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)] items-start gap-[var(--aifk-space-3,0.75rem)] max-[36rem]:grid-cols-1",
  "research-agent__work-primary": "research-agent__work-primary grid min-w-0 gap-[var(--aifk-space-3,0.75rem)]",
  "research-agent__tool": "research-agent__tool grid min-w-0 gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent py-[var(--aifk-space-4,1rem)] [&>header]:flex [&>header]:items-center [&>header]:justify-between [&>header]:gap-[var(--aifk-space-3,0.75rem)] [&>header]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&>header]:capitalize [&>header]:text-[var(--aifk-text-muted,GrayText)] [&>strong]:[overflow-wrap:anywhere] [&>strong]:[font:600_var(--aifk-type-font-size-sm,0.875rem)/1.4_ui-monospace,SFMono-Regular,Consolas,monospace] [&>p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&>p]:leading-[1.5] [&>p]:text-[var(--aifk-text-muted,GrayText)] [&_[role=alert]]:text-[var(--aifk-destructive,CanvasText)]",
  "research-agent__tool-output": "research-agent__tool-output m-0 grid grid-cols-[minmax(0,1fr)_auto] gap-[var(--aifk-space-2,0.5rem)] border-t border-[var(--aifk-border,ButtonBorder)] py-[var(--aifk-space-3,0.75rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_dt]:text-[var(--aifk-text-muted,GrayText)] [&_dd]:m-0 [&_dd]:font-bold",
  "research-agent__approval": "research-agent__approval",
  "research-agent__sources": "research-agent__sources grid gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent py-[var(--aifk-space-4,1rem)] [&_ol]:m-0 [&_ol]:grid [&_ol]:list-none [&_ol]:gap-[var(--aifk-space-2,0.5rem)] [&_ol]:p-0 [&_li]:grid [&_li]:grid-cols-[minmax(0,1fr)_auto] [&_li]:gap-[var(--aifk-space-3,0.75rem)] [&_li]:border-t [&_li]:border-[var(--aifk-border,ButtonBorder)] [&_li]:py-[var(--aifk-space-2,0.5rem)] [&_a]:[overflow-wrap:anywhere] [&_a]:text-[var(--aifk-accent,Highlight)] [&_li_span]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_li_span]:text-[var(--aifk-text-muted,GrayText)] [&>button]:justify-self-start [&>button]:cursor-pointer [&>button]:rounded-[var(--aifk-radius-medium,0.625rem)] [&>button]:border [&>button]:border-[var(--aifk-border-strong,ButtonBorder)] [&>button]:bg-transparent [&>button]:px-4 [&>button]:text-[var(--aifk-text,CanvasText)] max-[36rem]:[&_li]:grid-cols-1",
};

function cx(name: string) {
  return classNames[name] ?? name;
}

export type ResearchAgentStage = "streaming" | "approval" | "offline" | "reconnecting" | "failed" | "complete";
export type ResearchAgentCheckpointRecovery = Omit<CheckpointRecoveryProps, "task" | "connection" | "showConnectionNotice">;

export interface ResearchAgentProps {
  stage: ResearchAgentStage;
  onStageChange(stage: ResearchAgentStage, event: string): void;
  checkpointRecovery?: ResearchAgentCheckpointRecovery;
  scenario?: string;
}

const report: FileContentPart = {
  type: "file",
  name: "market-signal-brief.pdf",
  mediaType: "application/pdf",
  size: 428_000,
  status: "ready",
  source: { kind: "url", url: "https://example.com/market-signal-brief.pdf" },
};

function taskFor(stage: ResearchAgentStage): AgentTask {
  const complete = stage === "complete";
  const failed = stage === "failed";
  const paused = stage === "offline" || stage === "reconnecting";
  const approval = stage === "approval";
  return {
    id: "research-market-signals",
    threadId: "flagship-research-agent",
    title: "Research AI interface market signals",
    status: complete ? "complete" : failed ? "failed" : paused ? "paused" : approval ? "awaiting-approval" : "running",
    stepOrder: ["scope", "sources", "synthesis"],
    steps: {
      scope: { id: "scope", taskId: "research-market-signals", title: "Define evidence criteria", status: "complete" },
      sources: {
        id: "sources",
        taskId: "research-market-signals",
        title: "Review primary sources",
        status: failed ? "failed" : complete ? "complete" : approval || paused ? "pending" : "running",
        ...(stage === "streaming" ? { progress: { current: 3, total: 6, label: "3 of 6 sources" } } : {}),
        ...(failed ? { error: "One source returned a temporary 503 response." } : {}),
      },
      synthesis: { id: "synthesis", taskId: "research-market-signals", title: "Synthesize cited findings", status: complete ? "complete" : "pending" },
    },
    progress: complete ? { current: 3, total: 3, label: "Research complete" } : { current: stage === "streaming" ? 2 : 1, total: 3, label: "Research in progress" },
    ...(failed ? { error: "The research can continue after retrying the failed source." } : {}),
  };
}

function toolFor(stage: ResearchAgentStage): ToolCall {
  return {
    id: "search-primary-sources",
    name: "search_primary_sources",
    status: stage === "streaming" ? "running" : stage === "approval" ? "approval-requested" : stage === "failed" ? "failed" : stage === "complete" ? "complete" : "cancelled",
    input: { domains: ["vercel.com", "langchain.com"], query: "production AI interface patterns" },
    ...(stage === "complete" ? { output: { sourcesReviewed: 6, claimsSupported: 4 } } : {}),
    ...(stage === "failed" ? { error: "The LangGraph source is temporarily unavailable." } : {}),
  };
}

function connectionFor(stage: ResearchAgentStage): ConnectionState {
  if (stage === "offline") return { status: "offline", attempt: 0, updatedAt: 1, reason: "Network connection lost. Your progress is saved." };
  if (stage === "reconnecting") return { status: "reconnecting", attempt: 1, updatedAt: 2, reason: "Reconnecting and restoring the research stream." };
  return { status: "connected", attempt: 0, updatedAt: 3 };
}

function approvalFor(stage: ResearchAgentStage): Approval {
  return {
    id: "open-external-source",
    toolCallId: "search-primary-sources",
    summary: "Open an external product documentation source to verify the comparison.",
    status: stage === "approval" ? "requested" : stage === "streaming" ? "expired" : "approved",
  };
}

export function ResearchAgent({ stage, onStageChange, checkpointRecovery, scenario }: ResearchAgentProps) {
  const statusRef = useRef<HTMLParagraphElement>(null);
  const previousStage = useRef(stage);

  useEffect(() => {
    if (previousStage.current !== stage) statusRef.current?.focus();
    previousStage.current = stage;
  }, [stage]);

  const task = taskFor(stage);
  const tool = toolFor(stage);
  const connection = connectionFor(stage);
  const approval = approvalFor(stage);
  const active = stage !== "complete";
  const transition = (next: ResearchAgentStage, event: string) => onStageChange(next, event);

  return (
    <article className={cx("research-agent")} data-aifk-pattern="research-agent" data-fixture-pattern="research-agent" data-fixture-scenario={scenario} data-stage={stage}>
      <header className={cx("research-agent__header")}>
        <div>
          <span className={cx("research-agent__eyebrow")}>Research workspace</span>
          <h2 className="mt-[0.15rem]! text-[length:clamp(1.2rem,4vw,1.55rem)] tracking-[-0.025em]">AI interface market brief</h2>
        </div>
        <span className={cx("research-agent__run-status")} data-active={active}>{completeLabel(stage)}</span>
      </header>

      <p ref={statusRef} className={cx("research-agent__stage-status")} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} data-aifk-stage-status>
        Research workflow status: {completeLabel(stage)}.
      </p>

      {stage === "offline" || stage === "reconnecting" ? (
        <ConnectionPrimitive.Root connection={connection} onRetry={() => transition("reconnecting", "connection.retry()")} className={`${cx("research-agent__connection")} group`}>
          <span className={cx("research-agent__connection-dot")} aria-hidden="true" />
          <div><ConnectionPrimitive.Status /><ConnectionPrimitive.Message /></div>
          <ConnectionPrimitive.Retry />
          {stage === "reconnecting" ? <button type="button" onClick={() => transition("failed", "connection.restoreFailed()")}>Attempt restore</button> : null}
        </ConnectionPrimitive.Root>
      ) : null}

      <section className={cx("research-agent__brief")} aria-labelledby="research-question">
        <span className={cx("research-agent__avatar")} aria-hidden="true">N</span>
        <div>
          <h3 id="research-question">Research request</h3>
          <p>Compare the production UX patterns emerging across modern AI interface frameworks. Prioritize durable evidence and cite every conclusion.</p>
        </div>
      </section>

      <section className={cx("research-agent__response")} aria-labelledby="research-response">
        <div className={cx("research-agent__response-heading")}>
          <span className={cx("research-agent__spark")} aria-hidden="true">✦</span>
          <div><h3 id="research-response">Research agent</h3><span>{stage === "streaming" ? "Synthesizing evidence" : completeLabel(stage)}</span></div>
        </div>
        <p aria-live="polite" aria-atomic="true">
          {stage === "complete"
            ? "The strongest systems separate portable interaction state from provider transport, expose consequential actions for approval and preserve progress through transient failures."
            : "The evidence points toward provider-neutral state, explicit tool boundaries and recoverable long-running work"}
          {stage === "streaming" ? <span className={cx("research-agent__cursor")} aria-label="Response streaming">▍</span> : "."}
        </p>
        {stage === "complete" ? <File file={report} variant="muted" size="sm" /> : null}
        {stage === "streaming" ? <button type="button" className={cx("research-agent__primary")} onClick={() => transition("approval", "stream.complete()")}>Continue research</button> : null}
      </section>

      <div className={cx("research-agent__work-grid")}>
        <div className={cx("research-agent__work-primary")}>
          <AgentProgress task={task} {...(stage === "failed" ? { onResume: () => transition("complete", "task.retry()") } : {})} />
          {checkpointRecovery ? (
            <CheckpointRecovery
              {...checkpointRecovery}
              task={task}
              connection={connection}
              showConnectionNotice={false}
              headingLevel={3}
            />
          ) : null}
        </div>
        <ToolPrimitive.Root tool={tool} className={cx("research-agent__tool")}>
          <header><span>Tool execution</span><ToolPrimitive.Status /></header>
          <strong><ToolPrimitive.Name /></strong>
          <p>Searches only the approved primary documentation domains.</p>
          {stage === "complete" ? <dl className={cx("research-agent__tool-output")}><dt>Sources reviewed</dt><dd>6</dd><dt>Claims supported</dt><dd>4</dd></dl> : null}
          <ToolPrimitive.Error />
        </ToolPrimitive.Root>
      </div>

      {stage === "approval" ? (
        <div className={cx("research-agent__approval")}>
          <ToolApproval approval={approval} target="docs.langchain.com" reversible headingLevel={3} onApprove={() => transition("offline", "approval.approve()")} onReject={() => transition("failed", "approval.reject()")} />
        </div>
      ) : null}

      {stage === "complete" ? (
        <footer className={cx("research-agent__sources")}>
          <h3>Sources</h3>
          <ol>
            <li><a href="https://sdk.vercel.ai/docs" target="_blank" rel="noreferrer">AI SDK documentation</a><span>Streaming and tool UI</span></li>
            <li><a href="https://docs.langchain.com/oss/javascript/langgraph/streaming" target="_blank" rel="noreferrer">LangGraph streaming</a><span>Long-running agent state</span></li>
          </ol>
          <button type="button" onClick={() => transition("streaming", "workflow.replay()")}>Replay workflow</button>
        </footer>
      ) : null}
    </article>
  );
}

function completeLabel(stage: ResearchAgentStage) {
  if (stage === "streaming") return "Streaming";
  if (stage === "approval") return "Needs approval";
  if (stage === "offline") return "Paused offline";
  if (stage === "reconnecting") return "Reconnecting";
  if (stage === "failed") return "Recovery available";
  return "Complete";
}
