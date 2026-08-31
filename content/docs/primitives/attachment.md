---
title: Attachment primitive
description: Render controlled file-transfer status, native progress and guarded retry, replace, cancel or remove intent.
status: experimental
---

# Attachment primitive

`AttachmentPrimitive` presents one controlled `AttachmentUpload`. It keeps transfer state separate from transcript file-part state and provides async-safe recovery actions without owning an uploader.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
```

```tsx
import { AttachmentPrimitive } from "@aifrontkit/react/attachment";
```

## Usage

```tsx
<AttachmentPrimitive.Root
  attachment={upload}
  connection={connection}
  onRetry={(attachment) => uploader.retry(attachment.id)}
  onCancel={(attachment) => uploader.cancel(attachment.id)}
  onRemove={(attachment) => uploader.remove(attachment.id)}
>
  <AttachmentPrimitive.Status />
  <AttachmentPrimitive.Progress />
  <AttachmentPrimitive.Error />
  <AttachmentPrimitive.Retry />
  <AttachmentPrimitive.Cancel />
  <AttachmentPrimitive.Remove />
</AttachmentPrimitive.Root>
```

## Controlled contract

`AttachmentUpload.status` accepts `queued`, `uploading`, `paused`, `retrying`, `ready`, `failed` or `cancelled`. `progress.current` and optional `progress.total` produce native progress semantics. Leave `total` absent for indeterminate progress.

`error.message` must be safe user-facing copy. `error.recovery` declares `retry`, `replace` or `remove` and determines which recovery action a composition should expose.

The primitive never mutates the attachment. Retry, replace, cancel and remove callbacks emit intent. It blocks duplicate async actions until the active callback settles and converts callback rejection into local safe feedback. A host should update the controlled attachment only after its transfer boundary confirms a transition.

## Connection behavior

Pass `ConnectionState` when transfer activity depends on connectivity. Queued, uploading and retrying attachments are presented as effectively paused while the connection is offline or reconnecting. Their underlying controlled status stays unchanged.

Retry and replace require a connected state. Cancel remains available for active local work. Compose one `ConnectionPrimitive` above an attachment list instead of repeating a network alert for every file.

## Anatomy

| Part | Responsibility |
| --- | --- |
| `Root` | Named section, controlled context and duplicate-action guard. |
| `Status` | Atomic text for the effective transfer state. |
| `Progress` | Native determinate or indeterminate upload progress. |
| `Error` | Safe transfer or action failure feedback. |
| `Retry` | Guarded retry intent for declared recoverable states. |
| `Replace` | Guarded replace intent for replace-required failures. |
| `Cancel` | Guarded cancellation intent for active or paused work. |
| `Remove` | Guarded removal intent for queued, ready, failed or cancelled files. |

Stable selectors include `data-aifk-attachment`, `data-aifk-attachment-status`, `data-aifk-attachment-progress`, `data-aifk-attachment-error` and `data-aifk-attachment-action`. Root also exposes controlled status, effective status, recovery and pending action data attributes.

## Accessibility

Root is a named section and defaults to `Attachment: {filename}`. Status is atomic. Error uses alert semantics. Progress is labelled with the file name. Every action receives a filename-specific accessible name even when its visible label is short.

Keep recovery actions adjacent to the affected file, retain visible focus and preserve the row until controlled removal is confirmed. Do not rely on color alone to distinguish ready, paused or failed states.

## Runtime boundary

The primitive does not read files, upload bytes, queue retries, cancel a transport, persist drafts or resolve storage identifiers. Keep those concerns in the host uploader or adapter. The canonical command boundary can carry retry, cancel and remove intent without coupling the UI to one AI provider.

## Testing

Cover every status, determinate and indeterminate progress, safe action rejection, duplicate activation, offline effective pause, reconnecting, recovery-specific actions, controlled removal, keyboard focus and forced colors.
