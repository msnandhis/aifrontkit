# @aifrontkit/react

Accessible React providers, hooks and headless behavior primitives for AI chat interfaces and agent workflows.

```bash
npm install @aifrontkit/react
```

`@aifrontkit/react` includes `@aifrontkit/core` as a dependency. Provide a canonical runtime when streamed events should drive the interface:

```tsx
import { AIFrontKitProvider } from "@aifrontkit/react";

<AIFrontKitProvider runtime={runtime}>{children}</AIFrontKitProvider>
```

Focused exports cover conversation, message, composer, tool, task, approval, connection, artifact, attachment and checkpoint behavior. Visual components remain source-owned registry files, so applications can change markup and styles without forking runtime state.

Theme utilities and generated CSS use focused exports:

```ts
import { createTheme } from "@aifrontkit/react/theme";
import "@aifrontkit/react/theme.css";
```

The theme contract supports light, dark and high-contrast modes plus configurable temperature, density, radius and motion. Applications can use `ThemeProvider`, `createTheme` or raw semantic CSS variables independently.

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

AIFrontKit is prerelease software. See the [component documentation](https://github.com/msnandhis/aifrontkit/tree/main/content/docs/primitives) and [source registry](https://github.com/msnandhis/aifrontkit/tree/main/registry/react) before adoption.
