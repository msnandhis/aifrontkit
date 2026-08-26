---
title: Conversation
description: Compose an accessible transcript with controlled or runtime state and respectful scroll following.
status: experimental
---

# Conversation

Conversation is a source-installed visual component built on
`ConversationPrimitive`. It owns transcript semantics, near-end scroll tracking,
an empty state, and one shared activity announcement. Your application owns
transport, persistence, message actions, and model execution.

## Preview

The playground renders the real source component. Change transcript content,
state ownership, presentation, message variant, motion, lifecycle, slots, and
reading direction. Presets cover empty, streaming, interrupted, failed,
mixed-role, workspace, and RTL use cases. Generated code always contains the
exact content and configuration shown in the preview.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add conversation
```

The registry installs Message, File, and Prompt Input source dependencies.

```tsx
import { Conversation } from "@/components/aifrontkit/conversation";
```

## Usage

Choose one state mode for each instance.

```tsx
// Controlled: the host owns normalized messages.
<Conversation
  messages={messages}
  presentation="full-height"
  onSubmit={sendMessage}
/>
```

```tsx
// Runtime: the nearest provider owns normalized event state.
<AIFrontKitProvider runtime={runtime}>
  <Conversation
    header={<ConversationHeader />}
    footer={<PromptInput onSubmit={sendMessage} />}
  />
</AIFrontKitProvider>
```

Passing `messages` creates an internal runtime. `threadId` defaults to the first
message's thread or `controlled-conversation`. Without `messages`, Conversation
must be inside `AIFrontKitProvider`.

## Anatomy

| Part | Responsibility |
| --- | --- |
| Root | Named transcript region and presentation boundary. |
| Header | Optional non-scrolling context and local actions. |
| Viewport | Scroll container with near-end tracking. |
| Empty | First-use content when no messages exist. |
| List / Items | Ordered normalized message collection. |
| Scroll to latest | Appears after the reader moves away from the end. |
| Status | One polite announcement for transcript activity. |
| Footer | Optional non-scrolling composer or action surface. |

## Variants and states

`presentation` accepts `embedded` (default), `full-height`, or `workspace`.
`messageVariant` accepts Message's `minimal`, `conversation`, `dense`, and
`workspace` variants. `messageMotion` accepts `none`, `subtle`, or `expressive`.

Empty, streaming, interrupted, and failed meaning comes from normalized runtime
state. Interrupted and failed messages preserve partial content; compose retry or
continue controls through `renderMessage`.

```tsx
<Conversation
  messages={messages}
  renderMessage={(messageId, index, message) => (
    <Message
      messageId={messageId}
      metadata={<span>Message {index + 1}</span>}
      recovery={message.status === "failed" ? <Retry id={message.id} /> : null}
    />
  )}
/>
```

## API reference

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `presentation` | `"embedded" \| "full-height" \| "workspace"` | `"embedded"` | Structural layout. |
| `messages` | `readonly Message[]` | — | Enables controlled mode. |
| `threadId` | `string` | First message thread | Controlled runtime identity. |
| `header` | `ReactNode` | — | Non-scrolling heading or context. |
| `footer` | `ReactNode` | — | Replaces the generated prompt input. |
| `empty` | `ReactNode` | Built-in empty state | First-use content. |
| `onSubmit` | `(value: string) => void \| Promise<void>` | — | Creates the default Prompt Input when no footer is supplied. |
| `renderMessage` | `(id, index, message) => ReactNode` | Default Message | Replaces message presentation. |
| `messageVariant` | `MessageVariant` | `"conversation"` | Default Message presentation. |
| `messageMotion` | `MessageMotion` | `"subtle"` | Default Message motion. |
| `viewportProps` | `ConversationViewportProps` without children | — | Configures scrolling and the viewport element. |
| `label` | `string` | `"Conversation"` | Accessible transcript label inherited from the primitive. |

Other valid `section` props pass to the root. Stable selectors include
`data-slot="conversation"`, `conversation-header`, `conversation-viewport`,
`conversation-list`, `conversation-empty`, `conversation-scroll-to-latest`, and
`conversation-footer`. Primitive selectors use `data-aifk-conversation-*`.

## Styling and motion

Edit the installed CSS Module or override its global slot classes. Keep the
transcript reading measure bounded on wide screens. `ScrollToLatest` uses smooth
scroll only when the operating system does not request reduced motion; message
motion remains independently configurable.

## Accessibility

Conversation renders a named `section` and an ordered list. Do not wrap every
streamed token in a live region: the shared `Status` announces event-level state.
New output never moves keyboard focus. Native button behavior makes Scroll to
latest operable with Enter and Space.

If a page contains more than one transcript, give each a unique `label`. Keep
action names explicit and disable per-message status announcements when the
Conversation status already provides them.

## Responsive behavior

At narrow widths, keep the viewport and footer within the page, allow long
content to wrap, and preserve touch-safe controls. At workspace widths, constrain
the transcript rather than stretching prose across the pane. `viewportProps` can
adjust `followThreshold` (default `48`) or disable `followOutput`.

## Errors and recovery

Conversation displays normalized failure or interruption through Message. It
does not retry automatically. Preserve partial content and place retry, continue,
or cancel actions beside the affected message.

## Testing

Run deterministic fixtures before a live transport. Cover scroll-up during
streaming, Scroll to latest, empty content, partial failure, long histories,
keyboard order, RTL, localization, zoom, narrow layouts, and reduced motion.

## Compatibility

Registry version `0.3.0`; React `>=18.3 <20`; UI contract schema major `1`;
`@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
