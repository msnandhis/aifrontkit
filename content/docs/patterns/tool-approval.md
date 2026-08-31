---
title: Tool approval
description: Put an explicit, accessible decision boundary in front of consequential agent actions.
status: experimental
---

# Tool approval

`ToolApproval` composes `ApprovalPrimitive` into a review surface that explains
the proposed action, target, reversibility and current decision status before a
user can approve or reject it.

## Approval is intent, not completion

An approval click must not optimistically present a tool as complete. Send the
user's decision through the application transport and wait for a confirming
event. Resolved and expired approvals disable both actions to prevent duplicate
or stale decisions.

## Content requirements

- Describe the exact action in plain language.
- Identify the target account, file, environment or domain.
- State whether the action is reversible.
- Give reject and approve controls comparable reach and weight.
- Keep the final decision visible after controls are disabled.

```tsx
<ToolApproval
  approval={runtime.approvals[approvalId]}
  target="registry.aifrontkit.dev"
  reversible={false}
  onApprove={() => decide("approved")}
  onReject={() => decide("rejected")}
/>
```
