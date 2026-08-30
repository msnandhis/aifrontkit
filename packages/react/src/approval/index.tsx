import { createContext, useContext, type ComponentPropsWithoutRef, type PropsWithChildren } from "react";
import type { Approval } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

interface ApprovalContextValue {
  approval: Approval;
  onApprove: (() => void) | undefined;
  onReject: (() => void) | undefined;
}

const ApprovalContext = createContext<ApprovalContextValue | null>(null);

export interface ApprovalRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  approval?: Approval;
  approvalId?: string;
  onApprove?(): void;
  onReject?(): void;
}

function Frame({ approval, onApprove, onReject, children, ...props }: ApprovalRootProps & { approval: Approval }) {
  return <ApprovalContext.Provider value={{ approval, onApprove, onReject }}><section role="group" aria-label="Approval required" data-aifk-approval="" data-status={approval.status} {...props}>{children}</section></ApprovalContext.Provider>;
}

function RuntimeRoot({ approvalId, ...props }: Omit<ApprovalRootProps, "approval"> & { approvalId: string }) {
  const approval = useRuntimeState((state) => state.approvals[approvalId]);
  return approval ? <Frame {...props} approval={approval} /> : null;
}

function Root({ approval, approvalId, ...props }: ApprovalRootProps) {
  if (approval) return <Frame {...props} approval={approval} />;
  if (approvalId) return <RuntimeRoot {...props} approvalId={approvalId} />;
  throw new Error("ApprovalPrimitive.Root requires either `approval` or `approvalId`.");
}

function Summary(props: ComponentPropsWithoutRef<"p">) {
  const { approval } = useApproval();
  return <p {...props}>{props.children ?? approval.summary}</p>;
}

function Approve(props: ComponentPropsWithoutRef<"button">) {
  const { approval, onApprove } = useApproval();
  return <button type="button" {...props} disabled={Boolean(props.disabled) || approval.status !== "requested"} onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented) onApprove?.(); }}>{props.children ?? "Approve"}</button>;
}

function Reject(props: ComponentPropsWithoutRef<"button">) {
  const { approval, onReject } = useApproval();
  return <button type="button" {...props} disabled={Boolean(props.disabled) || approval.status !== "requested"} onClick={(event) => { props.onClick?.(event); if (!event.defaultPrevented) onReject?.(); }}>{props.children ?? "Reject"}</button>;
}

function Status(props: ComponentPropsWithoutRef<"span">) {
  const { approval } = useApproval();
  return <span role="status" aria-atomic="true" {...props}>{props.children ?? approval.status}</span>;
}

function useApproval() {
  const value = useContext(ApprovalContext);
  if (!value) throw new Error("ApprovalPrimitive component must be inside ApprovalPrimitive.Root.");
  return value;
}

export const ApprovalPrimitive = { Root, Summary, Approve, Reject, Status };
