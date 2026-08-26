# ADR 0007: Stable imports and framework policy

- Status: accepted
- Date: 2026-08-26

## Decision

Framework-neutral behavior uses package subpath imports:

```ts
import type { Message } from "@aifrontkit/core";
import { formatFileSize } from "@aifrontkit/core/content";
```

React runtime primitives use `@aifrontkit/react` or focused subpaths such as `@aifrontkit/react/message`. Installed presentation source uses the consumer-owned alias selected during initialization, for example:

```ts
import { File } from "@/components/aifrontkit/file";
```

React is the first presentation implementation. Next.js is supported as a React host in both App and Pages Routers. Web Components are the next cross-framework presentation target. Angular integration will wrap the framework-neutral contracts and Web Components where appropriate rather than importing React.

Version numbers do not become parent folders in source. Packages, registry items, contracts, and migration metadata carry semantic versions; Git tags and release channels select historical versions.

## Consequences

- No `v1/`, `v2/`, or `v3/` code trees drift in parallel.
- Breaking generations are maintained through release branches or package majors, with explicit migrations.
- Framework support expands without making the React implementation the product contract.

