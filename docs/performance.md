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

## Measurement

Use deterministic playground scenarios for sustained token streams, simultaneous tool/task updates, image-heavy messages, large artifacts, 1,000+ message histories, and low-end device throttling. Profile store reduction, subscription fan-out, rendering, parsing/sanitization, worker transfer cost, and memory separately.

## Server rendering and hydration

React components should render stable initial state where practical. Browser-only capabilities are isolated behind clear boundaries. Theme mode and initial thread data avoid visible hydration mismatch or flash.

## Trade-off rule

Do not sacrifice accessibility, sanitization, or deterministic state for benchmark numbers. Optimize measured bottlenecks and document degradation behavior for oversized inputs.
