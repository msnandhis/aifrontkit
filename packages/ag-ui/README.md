# @aifrontkit/ag-ui

Provider-neutral structural adapters for AG-UI and LangGraph event streams.
The package does not install or execute either provider runtime.

## LangGraph reference adapter

Create one adapter per graph run. Call `start()`, pass `messages`, `updates` and
`tools` stream-mode tuples to `adapt()` then call `finish()` or `fail()`. Message
chunks become ordered text parts, node updates become task steps and tool events
retain their upstream call identity.

## External store bridge

`createExternalStoreBridge` accepts the same `getSnapshot` and `subscribe`
shape used by React external stores. Its `project` callback converts provider
snapshots into AIFrontKit events without mirroring provider state in components.

Compatibility snapshots under `compatibility/fixtures/adapters` pin the exact
upstream release shapes covered by tests.
