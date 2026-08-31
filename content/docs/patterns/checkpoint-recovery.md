---
title: Checkpoint recovery
description: Resume, restore or restart long-running agent work with version safety, durable evidence and explicit confirmation.
status: experimental
---

# Checkpoint recovery

`CheckpointRecovery` is a source-owned recovery surface for long-running agent work. It ranks the safest available action, preserves read-only history and sends explicit intent without embedding a workflow engine, persistence backend or provider identifier.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add checkpoint-recovery
```

```tsx
import { CheckpointRecovery } from "@/components/aifrontkit/checkpoint-recovery";
```

## Controlled usage

```tsx
<CheckpointRecovery
  task={task}
  currentTaskVersion={taskVersion}
  checkpoints={checkpointHistory}
  connection={connection}
  operation={recoveryOperation}
  selectedCheckpointId={selectedCheckpointId}
  onSelectedCheckpointChange={setSelectedCheckpointId}
  onRestoreCheckpoint={(intent) => transport.restoreCheckpoint(intent)}
  onResumeTask={(taskId) => transport.resumeTask({ taskId })}
  onRestartTask={(intent) => transport.restartTask(intent)}
  onRetryConnection={transport.retryConnection}
/>
```

Task, checkpoint, connection and operation data are controlled projections. A callback expresses intent only. Do not mark a restore successful, replace the current task or discard newer history until the trusted host confirms the transition.

## Action priority

| Current state | Primary behavior |
| --- | --- |
| Running, queued or awaiting approval | Keep the newest saved point quiet and protect active work. |
| Paused with direct resume support | Offer Resume task before checkpoint restore. |
| Failed, cancelled or paused without direct resume | Offer the newest compatible checkpoint as Restore latest. |
| Older checkpoint selected | Require confirmation and explain that newer history remains. |
| Complete | Keep checkpoint history read-only and require confirmation before Run again. |
| Offline or reconnecting | Preserve selection and evidence, disable remote actions and never auto-restore. |
| Expired, incompatible or stale version | Explain why history cannot restore without exposing provider internals. |

Restart intent includes `taskId` and `expectedTaskVersion`. Restore intent includes `checkpointId`, `checkpointVersion` and version evidence. These version bindings prevent an old browser view from silently resuming changed task instructions.

## Thread and provider boundary

Load history for one authenticated thread and normalize it into `AgentCheckpoint[]`. The pattern does not fetch history, persist state, invoke LangGraph, authorize access, run graph code or own retries. Keep raw provider state, storage handles, serialized values, stack traces and credentials outside the browser projection.

For LangGraph, a saved state snapshot identifies where execution can continue but resume executes the latest graph code deployed by the host. Treat checkpoint compatibility as an explicit application decision. A state saved under older code is not evidence that the older code will execute.

AG-UI `STATE_SNAPSHOT` and `STATE_DELTA` synchronize frontend state. They are not durable recovery checkpoints. Do not enable restore from those events unless a trusted backend separately supplies durable checkpoint identity, version and compatibility metadata.

## Interaction and focus

- The newest compatible point is selected by default even if history arrives out of order.
- History disclosure does not hide unavailable evidence.
- Restoring an older point opens an `alertdialog` and focuses Cancel first.
- Restart uses the same safe confirmation rule.
- Closing a confirmation returns focus to its trigger.
- A controlled failure keeps selection and evidence then moves focus to one normalized error.
- Reconnecting never causes an automatic restore.

## Responsive and accessibility contract

At 375 pixels, long English, Arabic and Japanese labels wrap without horizontal overflow. Actions stack and remain at least 44 pixels tall. The history uses one radio group for usable points and unavailable rows remain readable without false selection controls. Focus is visible in light, dark, contrast and forced-color modes. Reduced motion removes nonessential transitions.

## Test matrix

Cover running protected, paused latest, paused direct resume, older confirmation, restoring, restore failed, offline safe, reconnecting, stale version, expired only, incompatible, restart confirmation, complete history and long history. Verify selection, disclosure, confirmation, focus restoration, connection gating, no auto-restore, controlled failure evidence, six mixed-state long-history rows and narrow-layout targets.

## Compatibility

Registry version `0.1.0`; React `>=18.3 <20`; UI contract schema major `1`; core event and command schema v4; `@aifrontkit/core >=0.1.0 <1`; `@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
