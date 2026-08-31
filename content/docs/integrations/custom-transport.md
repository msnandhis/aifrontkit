---
title: Custom transport
description: Connect any customer backend without adopting an external protocol adapter.
status: experimental
---

# Custom transport

A custom transport sends semantic commands to your endpoint and emits normalized
AIFrontKit events back to the runtime. It can use fetch streaming, Server-Sent
Events, WebSocket, local fixtures, or another application-specific mechanism.

The transport owns network lifecycle and translation. It does not render UI,
store React state, execute tools in the browser, or place provider credentials in
the client bundle.

Handle cancellation, disposal, reconnect policy, malformed events, duplicate
replayable events, and recoverable errors explicitly. Validate data at untrusted
boundaries before dispatching it to the runtime.

For resumable work, request checkpoint history for one authenticated thread and
project only normalized checkpoint metadata. Forward restore and restart intents
with their expected versions. The backend must verify thread ownership and
compatibility before loading durable state. A reconnect may refresh projections
but must never automatically restore a selected checkpoint.
