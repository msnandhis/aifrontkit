# Attachment composer

`AttachmentComposer` is a controlled source block for message drafts with file transfers. It composes `AttachmentPrimitive`, `ConnectionPrimitive`, `File` and `PromptInput` while leaving upload execution, storage, transport and persistence in the host application.

## Behavior contract

- Every retained attachment must be `ready` before send becomes available. Failed, cancelled, queued, uploading, paused and retrying files are never silently omitted.
- Ready attachments permit an attachment-only message. The submitted payload always contains the current ordered attachment IDs.
- Add and replace use one native file input. Cancelling the picker does not remove or mutate a failed row.
- Replacement remains controlled. The current row changes only when the host passes an updated `attachments` value.
- Retry, cancel, remove and replace callbacks express intent. Primitive action guards prevent duplicate async activation.
- Removing a row restores focus to the next row, the previous row or the Attach files action after the controlled list confirms removal.
- Offline and reconnecting states use one shared connection notice. The draft, transfer progress and file order remain visible.
- Two or more failed files expose a batch removal action. A failed batch operation retains the files and shows safe recovery copy.

```tsx
<AttachmentComposer
  attachments={uploads}
  connection={connection}
  value={draft}
  onValueChange={setDraft}
  onFilesSelected={(files) => uploader.add(files)}
  onRetry={(attachmentId) => uploader.retry(attachmentId)}
  onCancel={(attachmentId) => uploader.cancel(attachmentId)}
  onRemove={(attachmentId) => uploader.remove(attachmentId)}
  onReplaceFile={(attachmentId, file) => uploader.replace(attachmentId, file)}
  onRetryConnection={reconnect}
  onSubmit={({ text, attachmentIds }) => send({ text, attachmentIds })}
/>
```

Normalize provider failures into safe `AttachmentUpload.error` values before rendering. Do not pass raw service responses or credentials into the pattern.
