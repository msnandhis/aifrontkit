"use client";

import type { Approval } from "@aifrontkit/core";
import { ApprovalPrimitive } from "@aifrontkit/react/approval";

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
    <ApprovalPrimitive.Root {...rootProps} onApprove={onApprove} onReject={onReject}>
      <Heading>Approval required</Heading>
      <ApprovalPrimitive.Summary />
      <dl><dt>Target</dt><dd>{target}</dd><dt>Reversible</dt><dd>{reversible ? "Yes" : "No"}</dd></dl>
      <ApprovalPrimitive.Reject />
      <ApprovalPrimitive.Approve />
      <p>Status: <ApprovalPrimitive.Status /></p>
    </ApprovalPrimitive.Root>
  );
}
