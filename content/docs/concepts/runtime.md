---
title: Interaction runtime
description: Learn how normalized events become deterministic browser state and commands.
status: experimental
---

# Interaction runtime

The runtime reduces normalized events into conversation, message, stream, tool,
approval, artifact, attachment, task, and error state. Reducers remain pure;
transports and customer callbacks perform effects.

Applications read narrow selectors and send semantic commands such as submit,
stop, retry, approve, or reject. Capability negotiation determines whether an
action is available; a component does not infer backend support from appearance.

The same initial state and event sequence must produce the same snapshot. Replay,
cancellation, cleanup, optimistic reconciliation, and error recovery are explicit
contracts rather than component-local conventions.
