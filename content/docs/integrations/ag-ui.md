---
title: AG-UI adapter
description: Translate AG-UI protocol events into normalized AIFrontKit events.
status: experimental
---

# AG-UI adapter

`@aifrontkit/adapters/ag-ui` connects a backend that speaks the AG-UI protocol to the
AIFrontKit runtime. It isolates protocol-specific event names and payloads from
React primitives and source-installed UI.

The adapter does not style components, run an agent, call a model, or require the
AIFrontKit platform. Applications with a custom event protocol should use a
custom transport and omit this package.

Fixtures cover supported lifecycle, text, tool, and error mappings. Unknown or
invalid events must be surfaced safely and must not corrupt existing runtime state.

Run and step lifecycle events project into the canonical task model. Text and
tool streams produce schema v4 part-addressed events, including the distinct tool
input-streaming and running phases. Run failures remain task failures and do not
invent a transcript message.

## LangGraph checkpoint history

`projectLangGraphCheckpointHistory` from `@aifrontkit/adapters/langgraph`
translates the structural history returned
by `getStateHistory()` into thread-scoped checkpoint events. The host supplies a
stable checkpoint ID and version then explicitly decides whether each point is
restorable and compatible. Raw values, writes, tasks and provider persistence
handles are never projected to the browser.

Restoring a LangGraph checkpoint resumes through the latest graph code deployed
by the host. It does not replay the historical code that originally created the
state. Bind restore to checkpoint and task versions and reject a stale or
incompatible intent before invoking the graph.

AG-UI `STATE_SNAPSHOT` and `STATE_DELTA` events synchronize current frontend
state. They are not durable recovery checkpoints. AIFrontKit does not create
restorable checkpoint records from those events. A trusted backend must supply
durable identity, version and compatibility metadata separately.
