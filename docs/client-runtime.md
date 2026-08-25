# Client runtime

## Responsibility

The client runtime turns normalized events into deterministic browser state and exposes commands, selectors, lifecycle controls, and extension registries. It is framework-neutral and contains no rendering code.

## State domains

- Connection and stream lifecycle.
- Threads, branches, messages, and content parts.
- Draft composer state and attachment lifecycle.
- Reasoning disclosure, citations, feedback, and suggestions.
- Tool calls, approval requests, tasks, and human clarification.
- Artifact collection, active artifact, versions, and patches.
- Optimistic actions, recoverable errors, retries, cancellation, and reconnection.

## Runtime API shape

The public contract should resemble `createRuntime({ transport, initialState, capabilities, persistence })` and return `dispatch`, semantic commands, `getSnapshot`, `subscribe`, selectors, and `dispose`. Exact naming may evolve, but all framework adapters use the same contract.

## Commands and effects

Reducers remain pure. A command becomes an effect handled by a transport or customer callback. For example, `approveToolCall` updates optimistic UI and delegates execution confirmation; it never executes the tool. Failed effects produce normalized error events and rollback or reconciliation according to policy.

## Persistence interfaces

Customers may supply `loadThread`, `saveThread`, and checkpoint callbacks. The runtime defines serialization boundaries and debounce/retry hooks but ships no database. Sensitive transient state can be marked non-persistable.

## Capability negotiation

The runtime advertises supported actions based on configuration and server-provided capabilities. Components disable or hide unavailable actions with an explainable reason. A component must not infer support merely because a callback exists.

## Correctness requirements

- Deterministic reduction for the same initial state and event sequence.
- Idempotence for replayable events.
- Explicit cancellation and disposal; no orphan listeners or requests.
- Selectors with stable equality semantics to prevent unnecessary rendering.
- Framework-neutral test harness and time control.

