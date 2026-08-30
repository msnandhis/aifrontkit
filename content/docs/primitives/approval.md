---
title: Approval primitive
description: Bind consequential-action approval UI to controlled or normalized runtime state.
status: experimental
---

# Approval primitive

`ApprovalPrimitive` renders an `Approval` value directly or selects one by
`approvalId`. Approve and reject actions are enabled only while the approval is
requested and status changes are announced.

Applications own authorization and transport. A click is user intent, not proof
that a tool ran. Wait for a confirming event before presenting the action as
complete.
