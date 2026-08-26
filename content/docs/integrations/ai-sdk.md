---
title: AI SDK adapter
description: Translate Vercel AI SDK UI stream parts into normalized AIFrontKit events.
status: experimental
---

# AI SDK adapter

`@aifrontkit/ai-sdk` is useful only when a backend already emits the Vercel AI SDK
UI stream format. It translates supported stream parts into normalized AIFrontKit
events so the same runtime and UI work without protocol-aware components.

The adapter does not provide models, server routes, visual styling, hosted
services, or tool execution. Applications not using that stream format should not
install it.

Compatibility fixtures protect mappings as either project evolves. Unsupported
parts must produce an explicit fallback or diagnostic rather than disappearing.
