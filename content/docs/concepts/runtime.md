---
title: Interaction runtime
description: Learn how normalized events become deterministic browser state and commands.
status: experimental
---

# Interaction runtime

The runtime reduces normalized events into conversation, message, stream, tool,
approval, artifact, attachment, task, checkpoint and error state. Reducers remain pure;
transports and customer callbacks perform effects.

Applications read narrow selectors and send semantic commands such as submit,
stop, retry, approve, or reject. Capability negotiation determines whether an
action is available; a component does not infer backend support from appearance.

The same initial state and event sequence must produce the same snapshot. Replay,
cancellation, cleanup, optimistic reconciliation, and error recovery are explicit
contracts rather than component-local conventions.

## Events and commands

Events describe confirmed external facts. Commands describe user intent. The
runtime reduces events but never executes commands. Applications pass commands
through an explicit `CommandTransport`, where authentication, authorization and
network behavior remain customer-owned.

Long-running work uses `AgentTask` and ordered `TaskStep` records. Task state is
separate from messages so a paused run, approval wait or failed step stays
representable even when no component is mounted.

Connection state is also a projection rather than a network client. Transports
emit `connection.changed` facts for connected, reconnecting, offline and failed
states. Applications handle `connection.retry` and decide how backoff, browser
signals and provider reconnection work.

Checkpoint metadata is scoped to the active thread and reduced separately from
the task projection. `checkpoint.restore` and `task.restart` commands bind intent
to checkpoint and task versions. A reducer records confirmed checkpoint events
but never loads provider state or resumes work. The customer transport verifies
thread access, compatibility and version expectations before executing either
intent.
