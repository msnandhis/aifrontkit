"use client";

import { useEffect, useRef } from "react";
import type { AgentTask, Approval, ConnectionState, FileContentPart, ToolCall } from "@aifrontkit/core";
import { ConnectionPrimitive } from "@aifrontkit/react";
import { ToolPrimitive } from "@aifrontkit/react/tool";
import { File } from "../../components/file/file.js";
import { AgentProgress } from "../agent-progress/agent-progress.js";
import { ToolApproval } from "../tool-approval/tool-approval.js";
import styles from "./research-agent.module.css";

export type ResearchAgentStage = "streaming" | "approval" | "offline" | "reconnecting" | "failed" | "complete";

export interface ResearchAgentProps {
  stage: ResearchAgentStage;
  onStageChange(stage: ResearchAgentStage, event: string): void;
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

function cx(name: string) {
  return [styles[name], name].filter(Boolean).join(" ");
}

export function ResearchAgent({ stage, onStageChange, scenario }: ResearchAgentProps) {
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
          <h2>AI interface market brief</h2>
        </div>
        <span className={cx("research-agent__run-status")} data-active={active}>{completeLabel(stage)}</span>
      </header>

      <p ref={statusRef} className={cx("research-agent__stage-status")} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1} data-aifk-stage-status>
        Research workflow status: {completeLabel(stage)}.
      </p>

      {stage === "offline" || stage === "reconnecting" ? (
        <ConnectionPrimitive.Root connection={connection} onRetry={() => transition("reconnecting", "connection.retry()")} className={cx("research-agent__connection")}>
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
        <AgentProgress task={task} {...(stage === "failed" ? { onResume: () => transition("complete", "task.retry()") } : {})} />
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
