# Technology and performance strategy

This document is authoritative for the language, package-output, and performance decisions shared by both repositories.

## Technology decision

AIFrontKit uses **TypeScript as its implementation language and publishes optimized JavaScript for consumers**.

This applies to the schema and runtime, transports and adapters, React bindings, future Web Components, CLI, documentation/playground applications, Studio, and the private platform. Public packages include generated `.d.ts` declarations so consumers receive complete TypeScript tooling while JavaScript applications can use the same runtime normally.

CSS, semantic design tokens, JSON-compatible schemas, Markdown documentation, and static assets remain framework-neutral. TypeScript is not allowed to turn public configuration into framework-specific code.

## Module and package output

- Publish modern ESM JavaScript as the primary package format.
- Add CommonJS output only when measured consumer demand justifies its build, test, and support cost.
- Declare package side effects precisely so bundlers can remove unused code.
- Expose capability-focused entry points instead of a root import that loads every adapter, renderer, icon, or language.
- Publish source maps, declaration maps where useful, and export maps for supported public paths.
- Test packages as external consumers in supported bundlers and runtimes.

## Language boundary

Do not introduce Rust, Go, Python, Java, .NET, or WebAssembly implementations initially. Backend integration in other languages is demonstrated through small protocol examples, not maintained SDKs.

WebAssembly or a non-TypeScript implementation requires all of the following:

1. A repeatable production-like benchmark identifies a meaningful hotspot.
2. JavaScript, scheduling, data-shape, and worker-based optimizations have been evaluated first.
3. The gain materially improves a published performance budget.
4. Bundle size, startup, debugging, accessibility, portability, security, and maintenance costs are documented.
5. An architecture decision record approves the additional toolchain and ownership.

## Performance architecture

Performance comes primarily from boundaries and data flow, not the source language.

- Keep `schema` zero-dependency and `core` zero- or near-zero-dependency.
- Keep React outside schemas, state reduction, commands, transports, and adapters.
- Normalize runtime entities and subscribe through narrow, equality-aware selectors.
- Batch high-frequency stream deltas to a frame-appropriate cadence instead of committing one application render per token.
- Virtualize long conversations, thread lists, source lists, task histories, and file trees when measured thresholds are crossed.
- Lazy-load syntax highlighting, editors, charts, document/media viewers, sandboxes, and specialized artifact renderers.
- Keep Studio, registry authoring, documentation, and playground code out of customer runtime bundles.
- Move expensive parsing, sanitization, search, diff, or transformation to Web Workers only when measurement shows main-thread pressure.
- Bound event history, caches, decoded media, and detached preview resources.

## Package loading model

The essential path stays small:

```text
@aifrontkit/schema
@aifrontkit/core
@aifrontkit/react
@aifrontkit/primitives
@aifrontkit/themes
```

Heavy or specialized capabilities stay optional and lazy:

```text
@aifrontkit/artifacts
@aifrontkit/code
@aifrontkit/media
@aifrontkit/adapter-*
```

The Node.js CLI is independently installed or invoked and never enters browser bundles:

```text
@aifrontkit/cli
```

After core contracts stabilize, framework-neutral embedding is added as:

```text
@aifrontkit/web
```

## Initial performance budgets

Budgets are release gates measured with documented fixtures, a pinned build configuration, and both development diagnostics and production output. These are initial targets to validate during Phase 0, not permission to regress up to the limit.

| Surface | Initial target |
| --- | --- |
| `@aifrontkit/core`, including required schema/runtime code | ≤ 15 KB minified + gzip |
| `@aifrontkit/react`, excluding React and core | ≤ 8 KB minified + gzip |
| Essential conversation UI, excluding optional renderers and framework peers | ≤ 35 KB minified + gzip |
| Composer input-to-visible-feedback latency | ≤ 50 ms at p95 in the reference scenario |
| Streaming | No whole-thread render per token; updates remain within the frame budget in the reference scenario |
| Long thread | Remains responsive with 1,000 messages using the documented fixture and target device profile |
| Layout stability | Reserved media/artifact dimensions and no avoidable streaming-induced layout shifts |

The target browser/device profile, exact bundle composition, fixture, run count, percentile, and measurement tool must be stored beside results before a number is used in release decisions.

## Performance governance

- Record bundle and scenario results for every release candidate.
- Treat budget regressions as failing checks unless an approved exception explains user value and recovery plan.
- Profile state reduction, subscriptions, framework rendering, parsing/sanitization, media, and memory independently.
- Prefer representative low-end-device throttling and sustained streams over microbenchmarks alone.
- Preserve security, accessibility, correctness, and deterministic recovery while optimizing.

