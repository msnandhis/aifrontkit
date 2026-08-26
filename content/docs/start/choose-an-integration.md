---
title: Choose an integration
description: Decide between a custom transport, AI SDK adapter, and AG-UI adapter.
status: experimental
---

# Choose an integration

Use the smallest boundary that matches your backend:

| Backend output | Integration |
| --- | --- |
| Your own HTTP, WebSocket, or event format | Custom transport |
| Vercel AI SDK UI message stream | `@aifrontkit/ai-sdk` |
| AG-UI protocol events | `@aifrontkit/ag-ui` |

Adapters translate external event shapes into the same AIFrontKit events. They do
not add visual styles, execute tools, call providers, or create a platform
dependency. UI components therefore remain portable when a backend changes.

If you do not use either external protocol, install neither adapter. A custom
transport is a supported first-class route, not a fallback.
