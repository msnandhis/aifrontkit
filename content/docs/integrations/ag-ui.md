---
title: AG-UI adapter
description: Translate AG-UI protocol events into normalized AIFrontKit events.
status: experimental
---

# AG-UI adapter

`@aifrontkit/ag-ui` connects a backend that speaks the AG-UI protocol to the
AIFrontKit runtime. It isolates protocol-specific event names and payloads from
React primitives and source-installed UI.

The adapter does not style components, run an agent, call a model, or require the
AIFrontKit platform. Applications with a custom event protocol should use a
custom transport and omit this package.

Fixtures cover supported lifecycle, text, tool, and error mappings. Unknown or
invalid events must be surfaced safely and must not corrupt existing runtime state.
