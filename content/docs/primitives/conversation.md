---
title: Conversation
description: Compose an accessible transcript that handles streaming, scroll intent, and recovery.
status: experimental
---

# Conversation

Conversation is the behavioral container for a transcript. It owns viewport and
scroll semantics while Message owns individual content. It does not contain a
composer by default; a larger block may compose both capabilities.

## Anatomy

`Root` establishes context. `Viewport`, `List`, and `Items` render the transcript.
`Empty` and `Status` expose non-message states. `ScrollToLatest` appears when new
content arrives while the reader is away from the bottom.

## States and behavior

Support empty, loading, streaming, complete, interrupted, failed, and restored
states. Auto-follow only while the reader remains near the bottom. Preserve focus
and scroll position, avoid transcript-wide live regions, and permit consumer-owned
virtualization for long histories.

## Variants

The source-installed visual component may provide `embedded`, `full-height`, and
`workspace` compositions. Density and motion remain independent theme axes.

## Accessibility and testing

Test keyboard traversal, status announcements, zoom/reflow, new-message behavior,
mobile layouts, stream failure, restoration, and long deterministic histories.
