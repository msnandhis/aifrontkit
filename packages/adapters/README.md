# @aifrontkit/adapters

Optional AI SDK, AG-UI, LangGraph and external-store adapters for the AIFrontKit canonical frontend event model.

```bash
npm install @aifrontkit/adapters
```

Use explicit subpath imports so an application includes only its selected integration:

```ts
import { createAISDKAdapter } from "@aifrontkit/adapters/ai-sdk";
import { createAGUIAdapter } from "@aifrontkit/adapters/ag-ui";
import { createLangGraphAdapter } from "@aifrontkit/adapters/langgraph";
import { createExternalStoreBridge } from "@aifrontkit/adapters/external-store";
```

An adapter translates reviewed upstream stream parts, protocol events or store snapshots into `@aifrontkit/core` events. The same React components can therefore render a custom transport, Vercel AI SDK stream, AG-UI run or LangGraph workflow.

Adapters do not call providers, execute tools, authorize approval decisions, persist checkpoints or own backend state. The host application remains responsible for those operations.

AIFrontKit is prerelease software. See the [integration guide](https://github.com/msnandhis/aifrontkit/blob/main/content/docs/start/choose-an-integration.md) and [compatibility policy](https://github.com/msnandhis/aifrontkit/blob/main/content/docs/reference/compatibility.md) before adoption.
