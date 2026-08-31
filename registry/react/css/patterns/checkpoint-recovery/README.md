# Checkpoint recovery

`CheckpointRecovery` is a controlled source block for resuming long-running agent work. It is designed as a lightweight section below `AgentProgress`, so saved progress supports the task hierarchy without becoming another large card.

## Behavior contract

- Checkpoints are sorted by sequence from newest to oldest. Input order is preserved when sequences tie.
- The newest available and restorable checkpoint that matches the current task ID and version is selected by default.
- An intentional selection is preserved until it disappears or becomes unusable. The pattern then requests the newest usable selection and announces the change once.
- Running, queued and approval-waiting tasks keep saved progress read-only. A paused task offers direct resume first when the host supports it.
- Restoring an older point and restarting a task require confirmation. The newest usable point restores directly.
- Offline, reconnecting and failed connections preserve task evidence, history and selection. Recovery never starts automatically after reconnect.
- Composed workflows can set `showConnectionNotice={false}` while still passing `connection` for action gating, so a workspace-level connection banner remains the single notice.
- Operation state is controlled. Pending, success and failure never mutate task or checkpoint projections optimistically.
- Provider payloads, persistence handles, workflow engines and retry scheduling remain behind the host adapter.

```tsx
<CheckpointRecovery
  task={task}
  currentTaskVersion={taskVersion}
  checkpoints={checkpoints}
  connection={connection}
  operation={recoveryOperation}
  selectedCheckpointId={selectedCheckpointId}
  onSelectedCheckpointChange={setSelectedCheckpointId}
  onRestoreCheckpoint={(intent) => adapter.restoreCheckpoint(intent)}
  onResumeTask={(taskId) => adapter.resumeTask(taskId)}
  onRestartTask={(intent) => adapter.restartTask(intent)}
  onRetryConnection={reconnect}
/>
```

Normalize provider errors and compatibility failures before rendering. `checkpoint.id` and `task.id` are opaque identities and must never be parsed by the component.
