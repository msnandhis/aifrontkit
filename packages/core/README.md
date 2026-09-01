# @aifrontkit/core

Framework-neutral events, commands, state and browser runtime for production AI interfaces.

```ts
import { createRuntime } from "@aifrontkit/core/runtime";

const runtime = createRuntime({ threadId: "thread-1" });
runtime.dispatch(event);
```

The package has no React, provider or backend dependency. See the [repository documentation](https://github.com/msnandhis/openfrontkit#readme) for contracts and compatibility policy.

Deterministic component and playground helpers are isolated at
`@aifrontkit/core/testing` so normal runtime imports do not include fixture code.

Resumable agent checkpoints are exposed as a separate thread-scoped projection
through `@aifrontkit/core/checkpoint`. A checkpoint's `title` is its stable
display label. Its opaque identity and metadata must not be interpreted as raw
provider or persistence state.
