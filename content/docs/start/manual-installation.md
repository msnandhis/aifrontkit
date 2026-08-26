---
title: Install source manually
description: Copy registry source without the CLI while preserving packages, styles, and dependencies.
status: experimental
---

# Install source manually

Manual installation is supported when a team cannot run the CLI. Copy both the
component file and its adjacent `.module.css` file from the React/CSS registry.

## 1. Install behavior packages

Install the dependencies declared by the component manifest. For example:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
```

File needs `@aifrontkit/core`. Message, Prompt Input, Tool Call, and Conversation
use `@aifrontkit/react`; Conversation also installs Message and Prompt Input, and
Message installs File.

## 2. Copy source

Place copied files together so rewritten sibling imports resolve:

```text
src/components/aifrontkit/
├── conversation.tsx
├── conversation.module.css
├── file.tsx
├── file.module.css
├── message.tsx
├── message.module.css
├── prompt-input.tsx
├── prompt-input.module.css
├── tool-call.tsx
└── tool-call.module.css
```

Registry source imports siblings using paths such as `../file/file.js`. When
flattening the files manually, change those imports to `./file.js`. The CLI does
this rewrite automatically.

## 3. Import through your application alias

```tsx
import { Conversation } from "@/components/aifrontkit/conversation";
import { File } from "@/components/aifrontkit/file";
```

Do not import registry source directly from `node_modules`. The copied files are
application source: review them, edit them, and keep them under version control.

## Updating

Compare your copy with the matching registry item version before replacing it.
Preserve deliberate local edits and rerun type, interaction, accessibility, and
visual tests after every merge.
