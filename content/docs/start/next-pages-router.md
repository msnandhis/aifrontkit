---
title: Next.js Pages Router
description: Use AIFrontKit registry source and CSS Modules in a Pages Router application.
status: experimental
---

# Next.js Pages Router

Install packages and source from the application root:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit init
npx aifrontkit add file
```

Use a source component directly from a page:

```tsx
import { File } from "@/components/aifrontkit/file";

export default function FilesPage() {
  return (
    <File
      variant="muted"
      file={{
        type: "file",
        name: "architecture.pdf",
        mediaType: "application/pdf",
        source: { kind: "url", url: "https://example.com/architecture.pdf" }
      }}
    />
  );
}
```

AIFrontKit source uses component-local CSS Modules, so it does not require an
unsupported global stylesheet import from a page. Put only application-wide
tokens or resets in `pages/_app.tsx` when your theme needs them.

The repository production-builds a Pages Router fixture to protect this import
and styling boundary.
