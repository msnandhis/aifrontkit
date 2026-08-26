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

Message supports content parts rather than assuming one Markdown string. The
default registry Message renders File through the reference compound component.
Replace one content kind through typed renderer injection:

```tsx
<Message
  message={message}
  partComponents={{
    text: ({ part }) => <Markdown>{part.text}</Markdown>,
    file: ({ part }) => <File file={part} variant="muted" />
  }}
/>
```

At the primitive layer, `MessagePrimitive.Parts` accepts the same component map
or a `renderPart` function. Failed streams preserve partial content and expose
recovery actions.

Document and test role/name semantics, action labels, streaming completion,
reduced motion, narrow layouts, long content, unsupported content fallbacks, and
custom renderer boundaries.
