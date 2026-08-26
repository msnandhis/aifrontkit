# ADR 0003: UI layering and primitive ownership

## Status

Accepted.

## Decision

AIFrontKit uses one behavioral primitive layer and one source-owned presentation hierarchy:

- `@aifrontkit/react` contains headless runtime-bound compound primitives;
- `registry/ui` contains editable native-first visual building blocks;
- `registry/components` composes complete AI capabilities;
- `registry/patterns`, `registry/blocks`, and `registry/workspaces` compose progressively larger product structures.

Generic overlay and focus-management behavior is not reimplemented casually. Native platform behavior is preferred. A third-party accessible foundation may be used by a registry item after an accessibility, bundle, maintenance, and source-ownership review.

## Rationale

Calling both runtime-bound APIs and styled source files "primitives" creates unclear ownership and duplicate public APIs. Keeping behavioral primitives inside the existing React package avoids another npm release boundary. Calling the editable base layer `registry/ui` matches its purpose without making packages depend on registry source.

## Consequences

- A separate `@aifrontkit/primitives` package is deferred until another framework creates a genuine independent boundary.
- Registry items may depend only on public package exports and other declared registry items.
- A complete Conversation visual component is built from `ConversationPrimitive`; a larger block may add Prompt Input without making the primitive monolithic.
