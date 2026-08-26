# Prompt input

`PromptInput` is a source-owned composer built on `ComposerPrimitive`. It handles keyboard submission, async submit state, a growing text area, disabled presentation, and accessible labeling without connecting to AIFrontKit services.

Use `toolbarStart` for attachment, voice, model, or tool controls. `leading` holds richer context above the field. The submit action is icon-only by default and retains an accessible `submitLabel`; enable `showSubmitLabel` when a labeled button better fits the product.

```tsx
<PromptInput
  onSubmit={sendMessage}
  placeholder="Send a message…"
  toolbarStart={<AttachmentButton />}
  submitLabel="Send message"
/>
```

The component supports theme, density, radius, focus, disabled, touch, and reduced-motion tokens. Consumers can edit its copied source or replace individual slots without adding a runtime platform dependency.
