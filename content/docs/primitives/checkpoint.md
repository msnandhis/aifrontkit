---
title: Checkpoint primitive
description: Render durable agent recovery evidence and emit version-bound restore intent.
status: experimental
---

# Checkpoint primitive

`CheckpointPrimitive` renders one normalized `AgentCheckpoint` without knowing which workflow engine stored it. A controlled checkpoint can be passed directly or selected from the nearest AIFrontKit runtime by `checkpointId`.

```tsx
<CheckpointPrimitive.Root
  checkpoint={checkpoint}
  currentTaskVersion={taskVersion}
  taskStatus={task.status}
  connection={connection}
  operation={restoreOperation}
  onRestore={(intent) => transport.restoreCheckpoint(intent)}
>
  <CheckpointPrimitive.Title />
  <CheckpointPrimitive.Summary />
  <CheckpointPrimitive.CreatedAt />
  <CheckpointPrimitive.Status />
  <CheckpointPrimitive.Restore />
  <CheckpointPrimitive.Error />
</CheckpointPrimitive.Root>
```

## Restore contract

Restore callbacks receive the opaque checkpoint ID and checkpoint version plus the source and current task versions when present. Bind the command to the active thread on the trusted transport. Never parse an ID or infer compatibility from its text.

The primitive disables restore while the connection is unavailable, an operation is pending, the task is actively running or the saved point is expired, incompatible, non-restorable or bound to a different task version. It does not update checkpoint or task state optimistically. Render a pending state only after the host updates `operation` and render success only after a confirming event.

## Runtime selection

Checkpoint projections are thread-scoped. A runtime retains normalized metadata such as title, sequence, kind, status, source task version and completed milestone IDs. It does not contain provider persistence handles, raw workflow values, writes or credentials.

## Accessibility

Compose one labeled recovery section. Keep provider error text normalized, announce controlled operation failures once and keep restore actions as native buttons. A source pattern should require confirmation before restoring an older saved point or restarting a run.

## Compatibility

The checkpoint model and primitive use schema v4 contracts. The current public range is `@aifrontkit/core >=0.1.0 <1` and `@aifrontkit/react >=0.1.0 <1` with React `>=18.3 <20`.
