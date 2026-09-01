# @aifrontkit/react

Accessible React providers, hooks and headless behavior primitives for AIFrontKit.

```tsx
import { AIFrontKitProvider } from "@aifrontkit/react";

<AIFrontKitProvider runtime={runtime}>{children}</AIFrontKitProvider>
```

Visual components remain source-owned registry files. This package supplies stable behavior without coupling applications to an AI provider.

Theme utilities and generated CSS use focused exports:

```ts
import { createTheme } from "@aifrontkit/react/theme";
import "@aifrontkit/react/theme.css";
```

## Resumable checkpoints

`CheckpointPrimitive` exposes controlled, headless checkpoint behavior. Pass a normalized checkpoint directly or resolve one from an `AIFrontKitProvider` runtime with `checkpointId`. Restore intent is version-bound and is disabled while the source task is active, the connection is unavailable, the checkpoint is stale or a restore is pending.

```tsx
<CheckpointPrimitive.Root
  checkpointId="checkpoint-1"
  currentTaskVersion={4}
  taskStatus="paused"
  connection={connection}
  operation={restoreOperation}
  onRestore={(intent) => transport.restoreCheckpoint(intent)}
>
  <CheckpointPrimitive.Title />
  <CheckpointPrimitive.Summary />
  <CheckpointPrimitive.CreatedAt />
  <CheckpointPrimitive.Error />
  <CheckpointPrimitive.Restore />
</CheckpointPrimitive.Root>
```

The callback receives only provider-neutral identity and version fields. The application owns persistence, authorization, transport and the controlled recovery result.
