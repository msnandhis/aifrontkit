---
title: Next.js App Router
description: Compose AIFrontKit client components from App Router server and client boundaries.
status: experimental
---

# Next.js App Router

Install source normally:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit init
npx aifrontkit add conversation
```

Registry components already declare `"use client"`. A server page may render a
small client feature that owns callbacks and runtime state:

```tsx
// app/chat/page.tsx — Server Component
import { Chat } from "./chat";

export default function Page() {
  return <Chat />;
}
```

```tsx
// app/chat/chat.tsx — Client Component
"use client";

import { Conversation } from "@/components/aifrontkit/conversation";

export function Chat() {
  return (
    <Conversation
      messages={[]}
      empty={<p>Ask your first question.</p>}
      onSubmit={async (value) => {
        await fetch("/api/chat", { method: "POST", body: JSON.stringify({ value }) });
      }}
    />
  );
}
```

Callbacks, runtimes, and browser transports belong in the client feature. Data
fetched on the server can be serialized as normalized messages and passed into
that boundary. Component-local CSS Modules work without a global CSS import.
