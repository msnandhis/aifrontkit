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

Web Components and Angular are contract targets, not React wrappers disguised as
framework support. Their implementations will use the same normalized core model
and framework-neutral UI contracts when those lanes begin.

