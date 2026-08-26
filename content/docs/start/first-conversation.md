---
title: First conversation
description: Connect a runtime and render source-owned conversation UI.
status: experimental
---

# First conversation

Install the component and its behavior first:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add conversation
```

A conversation has three independent layers:

1. A transport receives backend events and sends user commands.
2. `@aifrontkit/core` reduces normalized events into deterministic state.
3. React primitives and registry source render that state accessibly.

Start in controlled mode when application state already owns normalized messages:

```tsx
import type { Message as MessageModel } from "@aifrontkit/core";
import { Conversation } from "@/components/aifrontkit/conversation";

const messages: MessageModel[] = [{
  id: "welcome",
  threadId: "demo",
  role: "assistant",
  status: "complete",
  parts: [{ type: "text", text: "How can I help?" }],
  createdAt: Date.now()
}];

<Conversation messages={messages} onSubmit={sendMessage} />;
```

Use runtime mode when streamed provider or protocol events should drive the same UI:

```tsx
import { AIFrontKitProvider } from "@aifrontkit/react";

<AIFrontKitProvider runtime={runtime}>
  <Conversation onSubmit={sendMessage} />
</AIFrontKitProvider>
```

Both modes use the same `Message` model. Components never call a model provider
directly and do not contain authoritative billing, entitlement, or business logic.

Customize individual messages without replacing Conversation behavior:

```tsx
<Conversation
  messages={messages}
  renderMessage={(_id, _index, message) => (
    <Message message={message} variant="conversation" actions={<MessageActions />} />
  )}
/>
```

During streaming, follow output only while the reader remains near the bottom.
If the reader scrolls upward, preserve their position and offer a “scroll to
latest” action. Preserve partial content when a stream fails so retry and recovery
remain understandable.

Use deterministic fixtures before connecting a live backend. They make loading,
streaming, interrupted, failed, and long-conversation states reproducible.
