---
title: First conversation
description: Connect a runtime and render source-owned conversation UI.
status: experimental
---

# First conversation

A conversation has three independent layers:

1. A transport receives backend events and sends user commands.
2. `@aifrontkit/core` reduces normalized events into deterministic state.
3. React primitives and registry source render that state accessibly.

Create the runtime at an application boundary, provide it once, then compose the
Conversation, Message, and Prompt Input capabilities. Components never call a
model provider directly and do not contain authoritative business logic.

During streaming, follow output only while the reader remains near the bottom.
If the reader scrolls upward, preserve their position and offer a “scroll to
latest” action. Preserve partial content when a stream fails so retry and recovery
remain understandable.

Use deterministic fixtures before connecting a live backend. They make loading,
streaming, interrupted, failed, and long-conversation states reproducible.
