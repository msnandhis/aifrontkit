---
title: Packages
description: Understand the responsibility and dependency boundary of each public package.
status: experimental
---

# Packages

| Package | Responsibility |
| --- | --- |
| `@aifrontkit/core` | Framework-neutral events, state, selectors, commands, and runtime |
| `@aifrontkit/react` | React provider, hooks, and accessible behavior primitives |
| `@aifrontkit/tokens` | Framework-neutral semantic theme contracts and CSS variables |
| `@aifrontkit/ai-sdk` | Optional AI SDK UI stream translation |
| `@aifrontkit/ag-ui` | Optional AG-UI protocol translation |
| `@aifrontkit/testing` | Deterministic fixtures and public test helpers |

Core never imports React. Adapters import core contracts but not React or each
other. Tokens contain no runtime behavior. Production packages never import the
testing package or registry source. Public exports are the compatibility surface;
deep imports into `src` or `internal` are unsupported.
