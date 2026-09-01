# @aifrontkit/core

Framework-neutral events, commands, state and browser runtime for AI chat interfaces and long-running agent experiences.

```bash
npm install @aifrontkit/core
```

## Runtime

Create one runtime per thread and dispatch normalized events from a custom transport or `@aifrontkit/adapters`:

```ts
import { createRuntime } from "@aifrontkit/core/runtime";

const runtime = createRuntime("thread-1");
runtime.dispatch(event);

const unsubscribe = runtime.subscribe(() => {
  console.log(runtime.getState());
});
```

Runtime state includes messages, content parts, tools, approvals, agent tasks, artifacts, connection status and resumable checkpoint projections. Event identifiers are deduplicated and supported older schema generations migrate at the boundary.

## Focused exports

- `@aifrontkit/core/events` for versioned frontend events
- `@aifrontkit/core/commands` for user intent commands and transports
- `@aifrontkit/core/runtime` for deterministic state reduction
- `@aifrontkit/core/checkpoint` for thread-scoped checkpoint projections
- `@aifrontkit/core/testing` for deterministic component and playground fixtures
- `@aifrontkit/core/schemas/v4/event.json` and related JSON schemas for wire validation

The package has no React, DOM, model-provider or backend dependency. It does not execute tools, authorize user actions or persist application data.

AIFrontKit is prerelease software. See the [repository documentation](https://github.com/msnandhis/aifrontkit#readme) and [compatibility policy](https://github.com/msnandhis/aifrontkit/blob/main/content/docs/reference/compatibility.md) before adoption.
