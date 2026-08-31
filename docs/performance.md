# Performance

The cross-repository language, module-output, loading, and budget policy is defined in [Technology and performance strategy](./strategy/technology-and-performance.md). This document defines how the OSS repository implements and verifies that policy.

## Goals

Streaming should remain responsive in long threads, initial bundles should include only selected capabilities, and media/artifact workloads should not block conversation input.

## Design rules

- Core state uses normalized entities and narrow selectors.
- Batch high-frequency deltas to a frame-appropriate cadence while preserving final correctness.
- Virtualize long message/thread/file lists when measured thresholds justify it.
- Lazy-load heavy renderers such as syntax highlighting, editors, charts, PDF, media, and sandboxed previews.
- Keep framework-neutral packages side-effect-free and exports tree-shakeable.
- Avoid importing all registry items, icons, languages, or renderers through one entry point.
- Keep Studio, registry authoring, docs, playground, and CLI code outside browser runtime dependency graphs.
- Run parsing, sanitization, diffing, or search in a Web Worker only when profiling demonstrates main-thread contention.
- Bound in-memory event history; persistence/replay policy is explicit.

## Budgets

The initial release gates are:

- `core`, including required schema/runtime code: no more than 15 KB minified + gzip.
- React binding, excluding React and core: no more than 8 KB minified + gzip.
- Essential conversation UI, excluding optional renderers and framework peers: no more than 35 KB minified + gzip.
- Composer input-to-visible-feedback latency: no more than 50 ms at p95 in the reference scenario.
- Streaming must not cause a whole-thread render per token and must remain inside the reference frame budget.
- A 1,000-message fixture must remain responsive on the documented target-device profile.

Before enforcement, the benchmark fixture, target browser/device, bundle composition, build settings, tools, run count, and percentile calculation are checked into the performance harness. Results are recorded per release; regressions require an approved, time-bounded exception.

### Enforced playground budgets

The production documentation playground is the browser composition used to guard loading architecture. `pnpm performance:check` reads Vite's production manifest after `pnpm build` and fails when any of these gzip ceilings is exceeded:

- Initial JavaScript: 96 KiB, with a 300 KiB raw ceiling.
- Initial CSS: 12 KiB, with an 80 KiB raw ceiling.
- Complete initial asset payload: 110 KiB.
- One documentation route: 6 KiB, with a 24 KiB raw ceiling.
- All documentation routes combined: 80 KiB.
- One other on-demand feature such as search or an interactive preview: 40 KiB, with a 128 KiB raw ceiling.

At least 48 documentation sources must remain independent dynamic entries. This makes route-level splitting an enforced architectural property rather than a build-output observation. Limits and their machine-readable schema live in `tooling/performance/budgets.json` and `tooling/performance/budgets.schema.json`.

The gate uses deterministic level-9 gzip measurements over emitted assets. It follows each entry's complete static import closure and includes associated CSS or assets. Initial assets are excluded from lazy route and on-demand measurements because the browser has already loaded them. Shared files are counted once within each measured route and once in the combined route total. React, React DOM and the selected AIFrontKit documentation shell are therefore included in the browser entry measurement. The limits intentionally leave bounded headroom over the checked-in reference build. Raising a limit requires a reviewed configuration and documentation change.

## Measurement

Use deterministic playground scenarios for sustained token streams, simultaneous tool/task updates, image-heavy messages, large artifacts, 1,000+ message histories, and low-end device throttling. Profile store reduction, subscription fan-out, rendering, parsing/sanitization, worker transfer cost, and memory separately.

## Server rendering and hydration

React components should render stable initial state where practical. Browser-only capabilities are isolated behind clear boundaries. Theme mode and initial thread data avoid visible hydration mismatch or flash.

## Trade-off rule

Do not sacrifice accessibility, sanitization, or deterministic state for benchmark numbers. Optimize measured bottlenecks and document degradation behavior for oversized inputs.
