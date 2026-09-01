# @aifrontkit/adapters

Provider-neutral boundaries that translate upstream protocols and stores into
AIFrontKit's canonical event model.

Install only this adapter collection when a provider integration is needed:

```sh
pnpm add @aifrontkit/adapters
```

Use explicit subpaths so bundlers include only the selected integration:

```ts
import { createAISDKAdapter } from "@aifrontkit/adapters/ai-sdk";
import { createAGUIAdapter } from "@aifrontkit/adapters/ag-ui";
import { createLangGraphAdapter } from "@aifrontkit/adapters/langgraph";
import { createExternalStoreBridge } from "@aifrontkit/adapters/external-store";
```

Adapters do not run providers or own backend state. They normalize reviewed
external shapes into `@aifrontkit/core` events.
