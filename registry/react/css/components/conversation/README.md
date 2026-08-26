# Conversation

`Conversation` renders normalized messages through the headless `ConversationPrimitive`. It follows output only while the reader remains near the bottom and exposes a scroll-to-latest action after the reader moves upward.

Use controlled mode when the host already owns messages:

```tsx
<Conversation messages={messages} onSubmit={sendMessage} />
```

Use runtime mode for normalized streaming events:

```tsx
<AIFrontKitProvider runtime={runtime}>
  <Conversation onSubmit={sendMessage} />
</AIFrontKitProvider>
```

Use `embedded` for an existing page flow, `full-height` for a dedicated assistant surface, and `workspace` when the transcript sits beside artifacts or sources. Supply `renderMessage` to receive the ID, index, and normalized message and replace presentation without replacing transcript behavior.

The component deliberately keeps presentation slots small: `header`, `footer`, `empty`, and `renderMessage`. The default footer treatment supports a floating composer without adding application chrome, while the transcript remains readable at a constrained measure on large screens and edge-aware on mobile.
