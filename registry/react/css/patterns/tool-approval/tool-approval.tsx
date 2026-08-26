export interface ToolApprovalProps {
  summary: string;
  target: string;
  reversible: boolean;
  onApprove(): void;
  onReject(): void;
}

export function ToolApproval({ summary, target, reversible, onApprove, onReject }: ToolApprovalProps) {
  return (
    <section role="group" aria-labelledby="approval-title">
      <h3 id="approval-title">Approval required</h3>
      <p>{summary}</p>
      <dl><dt>Target</dt><dd>{target}</dd><dt>Reversible</dt><dd>{reversible ? "Yes" : "No"}</dd></dl>
      <button type="button" onClick={onReject}>Reject</button>
      <button type="button" onClick={onApprove}>Approve</button>
    </section>
  );
}
