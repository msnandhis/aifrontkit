---
title: Vite setup
description: Add AIFrontKit source components to a React and Vite application.
status: experimental
---

# Vite setup

Create or open a React Vite project, then install the behavior used by your
components:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit init
npx aifrontkit add conversation
```

Ensure the `@` alias resolves to `src` in both Vite and TypeScript. If your project
does not use that alias, change `aliases.aifrontkit` in `aifrontkit.json` to a
relative directory such as `./src/components/aifrontkit`.

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { File } from "@/components/aifrontkit/file";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <File
      file={{
        type: "file",
        name: "brief.pdf",
        mediaType: "application/pdf",
        size: 2048,
        source: { kind: "url", url: "https://example.com/brief.pdf" }
      }}
    />
  </StrictMode>
);
```

CSS Modules are imported by each source component; no global component stylesheet
is required. The repository continuously builds an equivalent React/Vite fixture.
