# Message

An installable, source-owned message presentation for `@aifrontkit/react`. It reads normalized message state from `AIFrontKitProvider`; it does not call a model or require the AIFrontKit platform.

## Use

```tsx
<Message messageId="assistant-42" variant="conversation" motion="subtle" />
```

`variant` accepts `minimal`, `conversation`, `dense`, and `workspace`. `motion` accepts `none`, `subtle`, and `expressive`. Pass `avatar`, `metadata`, `actions`, or `recovery` to fill the optional visual slots. These change presentation only: role, streaming, completion, and failure semantics continue to come from the runtime.

For Markdown or custom content, pass children. The primitive keeps the message article and a single polite status announcement; streamed text itself is not a live region, avoiding token-by-token screen-reader noise.

## Customize

The component is your source code. Its CSS uses semantic custom properties with browser-safe fallbacks:

```css
:root {
  --aifk-message-user-background: var(--app-accent-subtle);
  --aifk-message-assistant-background: var(--app-panel);
  --aifk-message-border: var(--app-border);
  --aifk-motion-message-entry-duration: 180ms;
  --aifk-motion-message-entry-easing: cubic-bezier(.2, .8, .2, 1);
}
```

`prefers-reduced-motion` disables both entrance and streaming-indicator animation. File links have an explicit focus treatment, messages wrap long unbroken content, and the workspace layout becomes edge-to-edge on narrow screens.
