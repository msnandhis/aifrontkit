"use client";

import type { Approval } from "@aifrontkit/core";
import { ApprovalPrimitive } from "@aifrontkit/react/approval";

const rootClass = "aifk-tool-approval group/approval grid w-full gap-[var(--aifk-space-4,1rem)] border-y border-[var(--aifk-border-strong,ButtonBorder)] bg-transparent p-[clamp(1rem,3vw,1.5rem)] text-[var(--aifk-text,CanvasText)] [&_h2]:m-0 [&_h3]:m-0 [&_h4]:m-0 [&_p]:m-0 [&_dl]:m-0 motion-reduce:[&_*]:duration-[0.01ms]!";
const statusClass = "aifk-tool-approval__status shrink-0 py-[0.35rem] text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-semibold capitalize text-[var(--aifk-text-muted,GrayText)] group-data-[status=requested]/approval:rounded-[var(--aifk-radius-pill,999px)] group-data-[status=requested]/approval:border group-data-[status=requested]/approval:border-[color-mix(in_srgb,var(--aifk-accent,Highlight)_35%,var(--aifk-border,ButtonBorder))] group-data-[status=requested]/approval:bg-[var(--aifk-accent-muted,Canvas)] group-data-[status=requested]/approval:px-[0.55rem] group-data-[status=requested]/approval:text-[var(--aifk-accent,Highlight)] max-[30rem]:justify-self-start";
const buttonClass = "min-h-11 cursor-pointer rounded-[var(--aifk-radius-medium,0.625rem)] border border-[var(--aifk-border-strong,ButtonBorder)] px-4 font-[inherit] text-[length:var(--aifk-type-font-size-sm,0.875rem)] font-[650] not-disabled:hover:border-[var(--aifk-text,CanvasText)] disabled:cursor-not-allowed disabled:opacity-[0.48] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aifk-focus,Highlight)]";

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
    <ApprovalPrimitive.Root {...rootProps} className={rootClass} onApprove={onApprove} onReject={onReject}>
      <header className="aifk-tool-approval__header flex items-start justify-between gap-[var(--aifk-space-4,1rem)] max-[30rem]:grid max-[30rem]:grid-cols-1">
        <div className="grid gap-[var(--aifk-space-2,0.5rem)]">
          <span className="aifk-tool-approval__eyebrow font-mono text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-bold uppercase tracking-[0.08em] text-[var(--aifk-accent,Highlight)]">Tool request</span>
          <Heading className="text-[clamp(1.15rem,3vw,1.4rem)] leading-[1.2] tracking-[-0.025em]">Approval required</Heading>
        </div>
        <ApprovalPrimitive.Status className={statusClass} />
      </header>
      <ApprovalPrimitive.Summary className="aifk-tool-approval__summary max-w-[42rem] text-[length:var(--aifk-type-font-size-sm,0.875rem)] leading-[1.6] text-[var(--aifk-text-muted,GrayText)]" />
      <dl className="aifk-tool-approval__details grid grid-cols-[minmax(0,1.4fr)_minmax(8rem,0.6fr)] border-y border-[var(--aifk-border,ButtonBorder)] max-[30rem]:grid-cols-1 [&>div]:grid [&>div]:gap-[0.3rem] [&>div]:py-[var(--aifk-space-3,0.75rem)] [&>div+div]:border-s [&>div+div]:border-[var(--aifk-border,ButtonBorder)] [&>div+div]:ps-[var(--aifk-space-4,1rem)] max-[30rem]:[&>div+div]:border-s-0 max-[30rem]:[&>div+div]:border-t max-[30rem]:[&>div+div]:ps-0 [&_dt]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_dt]:text-[var(--aifk-text-subtle,GrayText)] [&_dd]:m-0 [&_dd]:[overflow-wrap:anywhere] [&_dd]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_dd]:font-[650]">
        <div><dt>Target</dt><dd>{target}</dd></div>
        <div><dt>Reversible</dt><dd>{reversible ? "Yes" : "No"}</dd></div>
      </dl>
      <footer className="aifk-tool-approval__actions flex justify-end gap-[var(--aifk-space-2,0.5rem)] max-[30rem]:grid max-[30rem]:grid-cols-2">
        <ApprovalPrimitive.Reject className={`${buttonClass} aifk-tool-approval__reject bg-transparent text-[var(--aifk-text,CanvasText)]`} />
        <ApprovalPrimitive.Approve className={`${buttonClass} aifk-tool-approval__approve border-[var(--aifk-action,ButtonFace)] bg-[var(--aifk-action,ButtonFace)] text-[var(--aifk-action-foreground,ButtonText)]`} />
      </footer>
    </ApprovalPrimitive.Root>
  );
}
