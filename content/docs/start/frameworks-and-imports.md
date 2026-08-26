---
title: Frameworks and imports
description: Choose stable behavior imports and source-owned component aliases across React and Next.js.
status: experimental
---

# Frameworks and imports

Use package imports for behavior and normalized data:

```ts
import type { Message } from "@aifrontkit/core";
import { formatFileSize } from "@aifrontkit/core/content";
import { MessagePrimitive } from "@aifrontkit/react/message";
```

Use your configured source alias for visual components:

```tsx
import { File } from "@/components/aifrontkit/file";
```

React with Vite, Next.js App Router, and Next.js Pages Router are real build
fixtures in this repository. Component-local CSS Modules avoid the Pages Router
restriction on global component CSS. Registry components that use React state or
context declare their client boundary, so an App Router server page can compose
them safely.

Choose the matching setup guide: [React](react.md), [Vite](vite.md),
[Next.js App Router](next-app-router.md), or
[Next.js Pages Router](next-pages-router.md).

Web Components and Angular are contract targets, not React wrappers disguised as
framework support. Their implementations will use the same normalized core model
and framework-neutral UI contracts when those lanes begin. They are not currently
supported installation targets; do not install React source into Angular or
treat a React wrapper as the long-term Web Component API.
