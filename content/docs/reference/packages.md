---
title: Packages
description: Understand the responsibility and dependency boundary of each public package.
status: experimental
---

# Packages

| Package | Responsibility |
| --- | --- |
| `aifrontkit` | Source installer, registry discovery, provenance and upgrade tooling |
| `@aifrontkit/core` | Framework-neutral events, state, selectors, commands, and runtime |
| `@aifrontkit/react` | React provider, primitives, semantic theme contracts and CSS variables |
| `@aifrontkit/adapters` | Optional AI SDK, AG-UI, LangGraph and external-store translations |

Core never imports React. Adapters import core contracts but not React. Theme
utilities live at `@aifrontkit/react/theme`, CSS at
`@aifrontkit/react/theme.css` and deterministic fixtures at
`@aifrontkit/core/testing`. Public exports are the compatibility surface. Deep
imports into `src` or `internal` are unsupported.

## Preview package migration

The early preview package names remain on npm only for migration history. New
applications should use these replacements:

| Early preview import | Maintained import |
| --- | --- |
| `@aifrontkit/tokens` | `@aifrontkit/react/theme` |
| `@aifrontkit/tokens/css` | `@aifrontkit/react/theme.css` |
| `@aifrontkit/testing` | `@aifrontkit/core/testing` |
| `@aifrontkit/ai-sdk` | `@aifrontkit/adapters/ai-sdk` |
| `@aifrontkit/ag-ui` | `@aifrontkit/adapters/ag-ui` |

The old preview packages receive no new features. Focused subpath exports keep
theme, fixture and provider code out of applications that do not import them.
