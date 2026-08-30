# @aifrontkit/core

Framework-neutral events, commands, state and browser runtime for production AI interfaces.

```ts
import { createRuntime } from "@aifrontkit/core/runtime";

const runtime = createRuntime({ threadId: "thread-1" });
runtime.dispatch(event);
```

The package has no React, provider or backend dependency. See the [repository documentation](https://github.com/msnandhis/openfrontkit#readme) for contracts and compatibility policy.
