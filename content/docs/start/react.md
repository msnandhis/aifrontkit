---
title: React setup
description: Connect AIFrontKit packages and editable source in a React application.
status: experimental
---

# React setup

AIFrontKit separates behavior packages from visual source:

```tsx
import { createRuntime } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { Conversation } from "@/components/aifrontkit/conversation";
```

Use controlled mode when your application already owns normalized messages:

```tsx
import type { Message } from "@aifrontkit/core";
import { Conversation } from "@/components/aifrontkit/conversation";

export function Chat({ messages }: { messages: readonly Message[] }) {
  return <Conversation messages={messages} onSubmit={sendMessage} />;
}

async function sendMessage(value: string) {
  // Send through your application transport.
}
```

Use a provider when normalized events drive a runtime:

```tsx
const runtime = createRuntime("thread-1");

<AIFrontKitProvider runtime={runtime}>
  <Conversation onSubmit={sendMessage} />
</AIFrontKitProvider>
```

Create the runtime outside render or memoize it. Your transport dispatches
normalized events to the runtime; no visual component opens a network connection.

React 18.3 and 19 are supported. Source components declare `"use client"`, use
CSS Modules, and can be edited without forking a package.
