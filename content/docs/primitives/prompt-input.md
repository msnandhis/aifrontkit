---
title: Prompt Input
description: Compose an accessible growing message field with async submission, context, and toolbar slots.
status: experimental
---

# Prompt Input

Prompt Input is editable visual source built on `ComposerPrimitive`. It owns the
draft field, Enter submission, bounded auto-growth, pending state, and safe error
feedback. Your application owns attachments, models, transport, and persistence.

## Preview

The playground renders the real source component. Change placeholder, hint,
submit labels, error copy, context, toolbar slots, and reading direction. Submit
the live composer to inspect its callback value in the event log.

## Installation

```bash
pnpm add @aifrontkit/react
npx aifrontkit add prompt-input
```

```tsx
import { PromptInput } from "@/components/aifrontkit/prompt-input";
```

## Usage

```tsx
<PromptInput
  onSubmit={sendMessage}
  placeholder="Ask about this workspace…"
  toolbarStart={<AttachmentButton />}
  hint="Enter to send"
/>
```

`onSubmit` receives a trimmed, non-empty value. The field clears only after the
callback resolves. If it rejects, the draft remains and `submitErrorMessage` is
shown beside the form.

## Anatomy

| Part | Responsibility |
| --- | --- |
| Root | Native form and async submission state. |
| Leading | Optional context above the field. |
| Field / Input | Labelled, controlled, auto-growing textarea. |
| Toolbar start | Host controls followed by optional guidance. |
| Submit | Disabled, ready, and pending native button. |
| Error | Safe user-facing rejection message. |

## Variants and states

Prompt Input has one structural style. Customize composition through `leading`,
`toolbarStart`, `hint`, and `showSubmitLabel`, not through unrelated visual
variants. Its real states are empty/disabled, ready, multiline, submitting, and
submit rejected.

Enter submits; Shift+Enter inserts a newline. Composition events used by input
methods do not submit. While pending, duplicate submission is blocked and the
button exposes busy meaning.

## API reference

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `onSubmit` | `(value: string) => void \| Promise<void>` | Required | Host submission callback. |
| `placeholder` | `string` | `"Ask a question"` | Input hint; not the accessible label. |
| `hint` | `ReactNode` | `"Enter to send"` | Visible keyboard or product guidance. |
| `leading` | `ReactNode` | — | Context above the field. |
| `toolbarStart` | `ReactNode` | — | Host controls before the hint. |
| `submitLabel` | `string` | `"Send message"` | Accessible name and optional visible label. |
| `showSubmitLabel` | `boolean` | `false` | Shows text beside the submit icon. |
| `submitErrorMessage` | `string` | Built-in safe message | Feedback after callback rejection. |
| `className` | `string` | — | Root style extension. |

Stable selectors include `data-slot="prompt-input"`, `prompt-input-leading`,
`prompt-input-field`, `prompt-input-toolbar`, and `prompt-input-submit`. The
primitive form exposes `data-submitting` and `data-error`.

## Styling and motion

The neutral default keeps the field visually primary and optional tools quiet.
Preserve a visible focus boundary around the active field and explicit disabled
contrast on submit. Auto-growth should stop at the CSS maximum block size. Reduced
motion removes the optional spinner movement without delaying state feedback.

## Accessibility

The field has a programmatic `Message` label independent of its placeholder. The
form and submit button retain native keyboard behavior. Rejection uses an alert;
submitting exposes `aria-busy`. Keep toolbar controls in logical source order and
give icon-only controls explicit names.

## Responsive behavior

At narrow widths, allow the toolbar to wrap without covering the textarea or
submit action. Keep controls touch-safe and the focused line visible above the
software keyboard. Long context and hints must wrap rather than widen the page.

## Errors and recovery

The component deliberately hides thrown implementation details. It keeps the
draft and displays `submitErrorMessage`. The host decides whether to retry,
reconnect, or queue the prompt; a retry should reuse the retained draft.

## Testing

Cover empty and whitespace drafts, Enter, Shift+Enter, input composition,
multiline growth, rejected and pending promises, duplicate prevention, toolbar
tab order, visible focus, RTL, narrow layouts, and reduced motion.

## Compatibility

Registry version `0.3.0`; React `>=18.3 <20`; UI contract schema major `1`;
`@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
