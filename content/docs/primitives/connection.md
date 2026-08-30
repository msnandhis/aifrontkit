---
title: Connection primitive
description: Present offline, reconnecting and failed transport states with an explicit recovery action.
status: experimental
---

# Connection primitive

`ConnectionPrimitive` renders controlled `ConnectionState` data or reads the
current connection projection from `AIFrontKitProvider`. It exposes a polite
status announcement, an explanatory message and a retry action.

The runtime records confirmed connection facts through `connection.changed`
events. A retry button expresses user intent through the `connection.retry`
command. AIFrontKit does not own the socket, retry timer or browser network
listener.

Retry stays disabled until the application supplies `onRetry` or its own click
handler. This prevents an offline interface from presenting an action that
cannot recover.

```tsx
<ConnectionPrimitive.Root onRetry={reconnect}>
  <ConnectionPrimitive.Status />
  <ConnectionPrimitive.Message />
  <ConnectionPrimitive.Retry />
</ConnectionPrimitive.Root>
```
