---
title: Research agent
description: A complete provider-neutral workflow for streaming, tools, approval, connection recovery, files and citations.
status: experimental
---

# Research agent

`ResearchAgent` is the flagship composition that proves AIFrontKit can model a
complete agent interface rather than only a chat transcript. The walkthrough is
frontend-only and every transition is exposed through an application callback.

## Included production states

| Stage | What the pattern demonstrates |
| --- | --- |
| Streaming | Partial output, active task progress and interruptible work. |
| Approval | An external action pauses at a visible decision boundary. |
| Offline | Confirmed progress remains visible while the transport is unavailable. |
| Reconnecting | Recovery status is announced without clearing the workspace. |
| Failed | One failed source can be retried without discarding successful work and compatible saved progress remains available. |
| Complete | The answer, generated file, tool result, citations and read-only checkpoint history remain inspectable. |

## Adapter boundary

Map backend events into canonical messages, tools, tasks, approvals and
connection state before they reach this pattern. The component reports user
intent through `onStageChange`; production applications replace the demo state
machine with transport commands and confirmed runtime events.

```tsx
<ResearchAgent
  stage={workspace.stage}
  checkpointRecovery={{
    currentTaskVersion: workspace.taskVersion,
    checkpoints: workspace.checkpoints,
    operation: workspace.checkpointOperation,
    onRestoreCheckpoint: restoreCheckpoint,
    onRestartTask: restartTask,
  }}
  onStageChange={(next, event) => sendInteraction(event, next)}
/>
```

Checkpoint recovery appears below task progress in the left work column. The
workspace connection banner remains the single network notice while the nested
recovery surface receives the same controlled connection for action gating.

Install the block with its registry dependencies to keep the source editable:

```bash
pnpm dlx aifrontkit@next add research-agent
```
