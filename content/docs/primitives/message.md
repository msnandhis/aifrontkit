---
title: Message
description: Render one normalized message with role hierarchy, typed content renderers, actions, and recovery.
status: experimental
---

# Message

Message is editable visual source built on `MessagePrimitive`. It presents one
normalized user, assistant, or system message. The host owns Markdown policy,
actions, retry behavior, and any unsupported content renderer.

## Preview

The playground renders the real source component. Change content, role,
lifecycle, presentation, motion, announcement behavior, optional slots, and
reading direction. Generated code uses the exact message visible in the preview.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add message
```

Message installs File as a registry dependency.

```tsx
import { Message } from "@/components/aifrontkit/message";
```

## Usage

Bind by ID inside an `AIFrontKitProvider`:

```tsx
<Message
  messageId="assistant-1"
  actions={<MessageActions />}
  metadata={<span>Just now</span>}
/>
```

Or pass a normalized message directly without a provider:

```tsx
<Message message={message} variant="dense" motion="none" />
```

By default, text parts render as text, images as native images, and file parts
through the installed File component. Inject renderers by content type:

```tsx
<Message
  message={message}
  partComponents={{
    text: ({ part }) => <Markdown>{part.text}</Markdown>,
    file: ({ part }) => <File file={part} variant="muted" />
  }}
/>
```

`renderPart` runs before the component map and default renderer. Return `undefined`
to let the next renderer handle the part.

## Anatomy

| Part | Responsibility |
| --- | --- |
| Root | Semantic article bound to `message` or `messageId`. |
| Avatar | Optional decorative product identity. |
| Header | Role and optional metadata. |
| Content / Parts | Ordered normalized content parts. |
| State | Streaming indicator, interruption, error, and recovery. |
| Actions | Host-owned actions related to this message. |
| Status | Event-level accessible status text. |

## Variants and states

`variant` accepts `minimal`, `conversation` (default), `dense`, or `workspace`.
`motion` accepts `none`, `subtle` (default), or `expressive`. Variants change
presentation, not the message model.

The normalized `status` is `streaming`, `complete`, `interrupted`, or `failed`.
Failure and interruption retain existing parts and expose their reason. Provide
`recovery` to compose retry or continue controls; Message never performs either
operation itself.

## API reference

| Prop | Type | Default | Purpose |
| --- | --- | --- | --- |
| `message` | `Message` | — | Provider-free normalized message. |
| `messageId` | `string` | — | Looks up a message in the nearest runtime. |
| `variant` | `"minimal" \| "conversation" \| "dense" \| "workspace"` | `"conversation"` | Visual structure. |
| `motion` | `"none" \| "subtle" \| "expressive"` | `"subtle"` | Entry/state motion level. |
| `children` | `ReactNode` | `MessagePrimitive.Parts` | Replaces all content rendering. |
| `partComponents` | `MessagePartComponents` | File override | Renderers keyed by `text`, `image`, or `file`. |
| `renderPart` | `MessagePartRenderer` | — | Highest-priority renderer for every part. |
| `avatar` | `ReactNode` | — | Decorative identity slot. |
| `metadata` | `ReactNode` | — | Secondary header content. |
| `actions` | `ReactNode` | — | Host-owned message controls. |
| `recovery` | `ReactNode` | — | Controls associated with failed/interrupted state. |
| `announceStatus` | `boolean` | `true` | Enables the primitive polite status. |
| `contentProps` | HTML `div` props without children | — | Configures the content container. |

Exactly one of `message` or `messageId` is normally supplied; `message` takes
precedence. Remaining valid `article` props pass to the primitive root. Stable
source selectors use `data-slot="message"` and named descendant slots. Primitive
state selectors include `data-aifk-message`, `data-role`, and `data-status`.

## Styling and motion

Assistant output is chromeless by default; user content receives a restrained
neutral surface. Keep actions visible on keyboard focus even if pointer UI reveals
them on hover. Motion never animates streamed tokens, and reduced-motion settings
must remove nonessential entry effects.

## Accessibility

The root is a labelled article with `aria-busy` while streaming. Role, error, and
interruption meaning remain text—not color alone. If Conversation provides the
shared activity announcement, set `announceStatus={false}` to avoid duplicate
announcements. Give every action an explicit accessible name.

## Responsive behavior

Long prose, URLs, code, and file names must stay inside the message container.
On narrow layouts, reduce decorative spacing before reducing readable type or
touch targets. Dense mode is for information density, not a mobile-only variant.

## Errors and recovery

`MessagePrimitive.Error` renders only for `failed`; `Interruption` renders only
for `interrupted`. Both preserve partial content. Recovery controls must be safe
to repeat and must not erase the original response before a retry succeeds.

## Testing

Test every role and status, parts in mixed order, renderer precedence, absent
optional slots, long content, keyboard-visible actions, RTL, zoom, reduced motion,
and status announcements. The component quality fixture supplies deterministic
visual and accessibility baselines.

## Compatibility

Registry version `0.4.0`; React `>=18.3 <20`; UI contract schema major `1`;
`@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
