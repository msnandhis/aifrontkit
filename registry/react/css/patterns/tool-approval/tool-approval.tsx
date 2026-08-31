"use client";

import type { Approval } from "@aifrontkit/core";
import { ApprovalPrimitive } from "@aifrontkit/react/approval";
import styles from "./tool-approval.module.css";

function classes(name: string) {
  return [styles[name], name].filter(Boolean).join(" ");
}

export interface ToolApprovalProps {
  summary?: string;
  approval?: Approval;
  approvalId?: string;
  target: string;
  reversible: boolean;
  headingLevel?: 2 | 3 | 4;
  onApprove(): void;
  onReject(): void;
}

export function ToolApproval({ summary, approval, approvalId, target, reversible, headingLevel = 2, onApprove, onReject }: ToolApprovalProps) {
  const controlled: Approval = {
    id: "controlled-approval",
    toolCallId: "controlled-tool",
    summary: summary ?? "Review the requested action before it continues.",
    status: "requested"
  };
  const rootProps = approval ? { approval } : approvalId ? { approvalId } : { approval: controlled };
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  return (
    <ApprovalPrimitive.Root {...rootProps} className={classes("aifk-tool-approval")} onApprove={onApprove} onReject={onReject}>
      <header className={classes("aifk-tool-approval__header")}>
        <div>
          <span className={classes("aifk-tool-approval__eyebrow")}>Tool request</span>
          <Heading>Approval required</Heading>
        </div>
        <ApprovalPrimitive.Status className={classes("aifk-tool-approval__status")} />
      </header>
      <ApprovalPrimitive.Summary className={classes("aifk-tool-approval__summary")} />
      <dl className={classes("aifk-tool-approval__details")}>
        <div><dt>Target</dt><dd>{target}</dd></div>
        <div><dt>Reversible</dt><dd>{reversible ? "Yes" : "No"}</dd></div>
      </dl>
      <footer className={classes("aifk-tool-approval__actions")}>
        <ApprovalPrimitive.Reject className={classes("aifk-tool-approval__reject")} />
        <ApprovalPrimitive.Approve className={classes("aifk-tool-approval__approve")} />
      </footer>
    </ApprovalPrimitive.Root>
  );
}
