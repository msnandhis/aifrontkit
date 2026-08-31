# @aifrontkit/ag-ui

Provider-neutral structural adapters for AG-UI and LangGraph event streams.
The package does not install or execute either provider runtime.

## LangGraph reference adapter

Create one adapter per graph run. Call `start()`, pass `messages`, `updates` and
`tools` stream-mode tuples to `adapt()` then call `finish()` or `fail()`. Message
chunks become ordered text parts, node updates become task steps and tool events
retain their upstream call identity.

`projectLangGraphCheckpointHistory` accepts the structural `StateSnapshot`
history returned by `getStateHistory()` and emits v4 checkpoint events for only
the candidates a host deliberately curates. The host must issue every public
checkpoint ID and version then explicitly decide compatibility and
restorability. Raw values, writes, tasks and LangGraph persistence handles are
never projected. Restoring a checkpoint resumes with the latest deployed graph
code. It does not restore the original executable.

AG-UI `STATE_SNAPSHOT` and `STATE_DELTA` events are frontend synchronization
signals rather than durable checkpoints, so the AG-UI adapter intentionally
ignores them.

## External store bridge

`createExternalStoreBridge` accepts the same `getSnapshot` and `subscribe`
shape used by React external stores. Its `project` callback converts provider
snapshots into AIFrontKit events without mirroring provider state in components.
The same bridge can publish the v4 checkpoint events produced by the LangGraph
history projector without installing or executing a provider runtime.

Compatibility snapshots under `compatibility/fixtures/adapters` pin the exact
upstream release shapes covered by tests.
