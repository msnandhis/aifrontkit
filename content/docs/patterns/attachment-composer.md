---
title: Attachment composer
description: Compose upload progress, partial-failure recovery, connection transitions and attachment-only messages without coupling UI to a provider.
status: experimental
---

# Attachment composer

`AttachmentComposer` is a source-owned production pattern for composing a message with ordered file transfers. It keeps the draft and every retained attachment visible through upload, recovery and connection changes. The host application remains responsible for upload execution, storage, provider IDs, authorization and message transport.

## Installation

```bash
pnpm add @aifrontkit/core @aifrontkit/react
npx aifrontkit add attachment-composer
```

```tsx
import { AttachmentComposer } from "@/components/aifrontkit/attachment-composer";
```

The registry also installs the `file` and `prompt-input` source dependencies.

## Controlled usage

```tsx
<AttachmentComposer
  attachments={uploads}
  connection={connection}
  value={draft}
  onValueChange={setDraft}
  accept=".pdf,.csv,.png"
  maxFiles={6}
  maxFileSize={25 * 1024 * 1024}
  onFilesSelected={(files) => uploadQueue.add(files)}
  onReplaceFile={(attachmentId, file) => uploadQueue.replace(attachmentId, file)}
  onRetry={(attachmentId) => uploadQueue.retry(attachmentId)}
  onCancel={(attachmentId) => uploadQueue.cancel(attachmentId)}
  onRemove={(attachmentId) => uploadQueue.remove(attachmentId)}
  onRetryConnection={reconnect}
  onSubmit={({ text, attachmentIds }) =>
    sendMessage({ text, attachmentIds })
  }
/>
```

`attachments` and `connection` are controlled projections. Callbacks express user intent only. Update the rendered projection after the host or adapter confirms a transition. The pattern does not optimistically delete a file or claim that a retry succeeded.

## Submission contract

Send is available only when the connection is `connected`, every retained attachment is `ready` and either text or at least one attachment exists. This allows attachment-only messages while preventing partial batches from being submitted.

`onSubmit` receives:

```ts
interface AttachmentComposerSubmit {
  text: string;
  attachmentIds: readonly string[];
}
```

The IDs preserve the current visual order. A failed or unfinished retained file blocks the whole submission. The pattern never drops that file from the payload without an explicit host-confirmed removal.

## State behavior

| State | Interface behavior | Available intent |
| --- | --- | --- |
| Ready | Shows quiet confirmation and permits send when the message is otherwise valid. | Remove |
| Queued | Keeps the file ordered and blocks send. | Remove |
| Uploading | Shows native determinate or indeterminate progress and blocks send. | Cancel |
| Paused | Preserves progress during an offline or reconnecting transition. | Local cancel and host-owned resume when supported |
| Retrying | Announces retry progress and prevents duplicate retry activation. | Cancel |
| Failed, retryable | Keeps safe failure copy beside the file and blocks send. | Retry or remove |
| Failed, replace required | Opens the shared native picker without removing the current row. | Choose another or remove |
| Cancelled | Keeps the cancelled row explicit until controlled removal. | Remove or retry when declared recoverable |
| Offline | Shows one shared connection notice and disables add, replace and send. | Local cancel or remove and connection retry |
| Reconnecting | Shows one shared continuation notice without a duplicate retry action. | Local cancel or remove |

When at least two files have failed, the pattern offers one batch Remove failed action. A rejection keeps the current list and displays a safe message.

## File picker and focus behavior

Add and replace share one native file input. Add permits multiple selection by default and can enforce `maxFiles` and `maxFileSize` before handing files to the host. Replace targets one controlled row and accepts one file. Closing the picker without a selection leaves the failed row unchanged. A confirmed replacement should receive a new upload ID so late events for the failed transfer cannot mutate the replacement.

After a controlled removal is observed, focus moves to the next attachment row, the previous row or Attach files when the list is empty. A rejected remove keeps focus and the row in place. Keyboard order follows the visible order from file list through message field and submit.

## Provider and runtime boundary

The pattern does not upload bytes, create signed URLs, persist drafts, resolve provider file IDs or listen to browser network events. An adapter should map service-specific transfer state into `AttachmentUpload` and map browser or transport signals into `ConnectionState`.

Normalize provider errors before rendering:

```ts
const upload: AttachmentUpload = {
  id: providerUpload.id,
  file: normalizedFile,
  status: mapProviderStatus(providerUpload.state),
  ...(providerUpload.failure
    ? { error: { message: safeMessage(providerUpload.failure), recovery: "retry" } }
    : {}),
};
```

Do not expose raw stack traces, storage paths, credentials or service response bodies in `error.message`.

## Accessibility

- The attachment collection is an ordered list and every row has a file-specific accessible name.
- Transfer progress uses native `progress` semantics. Omit a total for indeterminate work.
- Status transitions are atomic, visual percentage updates stay outside the live region and file errors use alert semantics.
- Connection interruption is announced once at the shared boundary instead of repeating the same network failure in every row.
- Add, retry, replace, cancel, remove and send are native buttons with explicit accessible names.
- Coarse-pointer targets are at least 44 pixels. Focus remains visible in light, dark, high-contrast and forced-color modes.
- At 375 pixels, actions wrap below file metadata without widening the page.
- Reduced-motion preferences remove nonessential animation without delaying state feedback.

## Testing

Cover ready, uploading batch, partial failure, retrying, offline paused, reconnecting, replace required, cancelling, attachment-only, long batch and connection failed fixtures. Verify duplicate action guards, picker cancellation, controlled replacement, focus after removal, attachment-only submission, blocked partial submission, native progress and no horizontal overflow at 375 pixels.

## Compatibility

Registry version `0.1.0`; React `>=18.3 <20`; UI contract schema major `1`; `@aifrontkit/core >=0.1.0 <1`; `@aifrontkit/react >=0.1.0 <1`. No platform runtime is required.
