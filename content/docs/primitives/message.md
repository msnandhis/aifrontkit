---
title: Message
description: Render role-aware, multimodal message content with quiet neutral defaults.
status: experimental
---

# Message

Message binds one normalized runtime message to accessible content renderers and
actions. The primitive owns behavior and semantics; registry source owns visual
composition.

Assistant content is mostly chromeless. User content uses a subtle neutral
surface. Metadata and actions use secondary emphasis, and actions remain keyboard
reachable even when visual UI reveals them on hover or focus.

Message supports content parts rather than assuming one Markdown string. Code,
citations, files, tools, reasoning disclosure, and errors receive dedicated
renderers. Failed streams preserve partial content and expose recovery actions.

Document and test role/name semantics, action labels, streaming completion,
reduced motion, narrow layouts, long content, unsupported content fallbacks, and
customer renderer boundaries.
