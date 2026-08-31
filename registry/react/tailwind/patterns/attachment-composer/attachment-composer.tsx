"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import type { AttachmentUpload, ConnectionState, FileContentPart } from "@aifrontkit/core";
import { AttachmentPrimitive, useAttachment } from "@aifrontkit/react/attachment";
import { ConnectionPrimitive } from "@aifrontkit/react/connection";
import { File } from "../../components/file/file.js";
import { PromptInput } from "../../components/prompt-input/prompt-input.js";

const classMap: Record<string, string> = {
  "aifk-attachment-composer": "aifk-attachment-composer @container box-border grid w-full min-w-0 max-w-[44rem] gap-[var(--aifk-space-4)] border-y border-[var(--aifk-border-strong)] bg-transparent p-[clamp(var(--aifk-space-4),3cqi,var(--aifk-space-6))] font-[var(--aifk-type-font-family-sans)] text-[var(--aifk-text)] [&_:is(h2,p)]:m-0 [&_button]:min-h-9 [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-control)] [&_button]:border [&_button]:border-[var(--aifk-border-strong)] [&_button]:bg-[var(--aifk-surface)] [&_button]:px-[var(--aifk-space-3)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-xs)] [&_button]:font-[var(--aifk-type-font-weight-semibold)] [&_button]:leading-none [&_button]:text-[var(--aifk-text)] [&_button]:transition-[background-color,border-color] [&_button]:duration-[var(--aifk-motion-duration-fast)] [&_button]:ease-[var(--aifk-motion-easing-standard)] [&_button:hover:not(:disabled)]:border-[var(--aifk-text)] [&_button:active:not(:disabled)]:bg-[var(--aifk-surface-subtle)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--aifk-focus)] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:text-[var(--aifk-text-subtle)] [&_button:disabled]:opacity-[0.58] @max-[31rem]:[&_button]:min-h-11 @max-[24rem]:p-[var(--aifk-space-4)] pointer-coarse:[&_button]:min-h-[max(2.75rem,var(--aifk-space-touch-target))] motion-reduce:[&_*]:duration-[0.01ms] motion-reduce:[&_*]:[animation-duration:0.01ms] motion-reduce:[&_*]:[animation-iteration-count:1] forced-colors:border-[CanvasText]",
  "aifk-attachment-composer__connection": "aifk-attachment-composer__connection flex min-w-0 items-center justify-between gap-[var(--aifk-space-4)] border-s-4 border-s-[var(--aifk-warning)] bg-[var(--aifk-surface-subtle)] px-[var(--aifk-space-4)] py-[var(--aifk-space-3)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-1)] [&_p]:text-[length:var(--aifk-type-font-size-sm)] [&_p]:leading-[var(--aifk-type-line-height-relaxed)] [&_p]:text-[var(--aifk-text-muted)] @max-[31rem]:grid forced-colors:border-[CanvasText]",
  "aifk-attachment-composer__attention": "aifk-attachment-composer__attention flex min-w-0 items-center justify-between gap-[var(--aifk-space-4)] border-s-4 border-s-[var(--aifk-destructive)] bg-[var(--aifk-surface-subtle)] px-[var(--aifk-space-4)] py-[var(--aifk-space-3)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-1)] [&_strong]:text-[length:var(--aifk-type-font-size-sm)] [&_strong]:font-[var(--aifk-type-font-weight-semibold)] [&_p]:text-[length:var(--aifk-type-font-size-sm)] [&_p]:leading-[var(--aifk-type-line-height-relaxed)] [&_p]:text-[var(--aifk-text-muted)] @max-[31rem]:grid @max-[31rem]:[&_button]:w-full forced-colors:border-s-[0.375rem] forced-colors:border-[CanvasText]",
  "aifk-attachment-composer__connection-status": "aifk-attachment-composer__connection-status text-[length:var(--aifk-type-font-size-sm)] font-[var(--aifk-type-font-weight-semibold)]",
  "aifk-attachment-composer__connection-action": "aifk-attachment-composer__connection-action @max-[31rem]:w-full",
  "aifk-attachment-composer__heading": "aifk-attachment-composer__heading flex min-w-0 items-center justify-between gap-[var(--aifk-space-4)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-1)] [&_h2]:text-[length:var(--aifk-type-font-size-md)] [&_h2]:leading-[var(--aifk-type-line-height-tight)] [&_p]:text-[length:var(--aifk-type-font-size-xs)] [&_p]:leading-[var(--aifk-type-line-height-relaxed)] [&_p]:text-[var(--aifk-text-muted)] [&_p]:[overflow-wrap:anywhere] @max-[24rem]:items-start @max-[24rem]:[&_p]:max-w-[15rem]",
  "aifk-attachment-composer__file-input": "aifk-attachment-composer__file-input absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] [clip:rect(0_0_0_0)] [margin:-1px]",
  "aifk-attachment-composer__action-error": "aifk-attachment-composer__action-error rounded-[var(--aifk-radius-medium)] border border-[var(--aifk-destructive)] bg-[color-mix(in_srgb,var(--aifk-destructive)_7%,var(--aifk-surface))] p-[var(--aifk-space-3)] text-[length:var(--aifk-type-font-size-sm)] text-[var(--aifk-destructive)]",
  "aifk-attachment-composer__list": "aifk-attachment-composer__list m-0 grid max-h-[23rem] min-w-0 list-none overflow-y-auto overscroll-y-contain border-y border-[var(--aifk-border)] p-0",
  "aifk-attachment-composer__item": "aifk-attachment-composer__item min-w-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aifk-focus)] [&+&]:border-t [&+&]:border-[var(--aifk-border)]",
  "aifk-attachment-composer__attachment": "aifk-attachment-composer__attachment group/attachment grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--aifk-space-3)] py-[var(--aifk-space-2)] @max-[31rem]:grid-cols-1 @max-[31rem]:gap-[var(--aifk-space-1)]",
  "aifk-attachment-composer__file": "aifk-attachment-composer__file w-full min-w-0 max-w-none border-0 bg-transparent py-[var(--aifk-space-1)] @max-[31rem]:[&_.aifk-file__name]:line-clamp-2 @max-[31rem]:[&_.aifk-file__name]:whitespace-normal @max-[31rem]:[&_.aifk-file__name]:[overflow-wrap:anywhere]",
  "aifk-attachment-composer__metadata": "aifk-attachment-composer__metadata flex min-w-0 flex-wrap items-center gap-x-[var(--aifk-space-2)] gap-y-[var(--aifk-space-1)] text-[length:var(--aifk-type-font-size-xs)] text-[var(--aifk-text-muted)] [&>*+*::before]:me-[var(--aifk-space-2)] [&>*+*::before]:text-[var(--aifk-text-subtle)] [&>*+*::before]:content-['·'] group-data-[effective-status=ready]/attachment:[&_[data-aifk-attachment-status-visual]]:text-[var(--aifk-success)] group-data-[effective-status=failed]/attachment:[&_[data-aifk-attachment-status-visual]]:text-[var(--aifk-destructive)] group-data-[effective-status=cancelled]/attachment:[&_[data-aifk-attachment-status-visual]]:text-[var(--aifk-destructive)] group-data-[effective-status=paused]/attachment:[&_[data-aifk-attachment-status-visual]]:text-[var(--aifk-warning)] group-data-[effective-status=retrying]/attachment:[&_[data-aifk-attachment-status-visual]]:text-[var(--aifk-warning)]",
  "aifk-attachment-composer__progress": "aifk-attachment-composer__progress mt-[var(--aifk-space-1)] block h-1.5 w-[min(100%,18rem)] accent-[var(--aifk-accent)] forced-colors:[forced-color-adjust:auto]",
  "aifk-attachment-composer__row-error": "aifk-attachment-composer__row-error !mt-[var(--aifk-space-1)] text-[length:var(--aifk-type-font-size-xs)] leading-[var(--aifk-type-line-height-relaxed)] text-[var(--aifk-destructive)] [overflow-wrap:anywhere]",
  "aifk-attachment-composer__actions": "aifk-attachment-composer__actions flex shrink-0 flex-wrap justify-end gap-[var(--aifk-space-1)] [&_button]:border-transparent [&_button]:bg-transparent [&_button]:px-[var(--aifk-space-2)] [&_button:hover:not(:disabled)]:border-[var(--aifk-border)] [&_button:hover:not(:disabled)]:bg-[var(--aifk-surface-subtle)] [&_[data-aifk-attachment-action=retry]]:text-[var(--aifk-accent)] @max-[31rem]:justify-start @max-[31rem]:ps-10",
  "aifk-attachment-composer__empty": "aifk-attachment-composer__empty border-y border-dashed border-[var(--aifk-border-strong)] p-[var(--aifk-space-4)] text-center text-[length:var(--aifk-type-font-size-sm)] text-[var(--aifk-text-muted)]",
  "aifk-attachment-composer__attach": "aifk-attachment-composer__attach inline-flex shrink-0 items-center justify-center gap-[var(--aifk-space-2)] [&_svg]:size-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-width:1.5] @max-[24rem]:px-[var(--aifk-space-2)]",
  "aifk-attachment-composer__prompt": "aifk-attachment-composer__prompt max-w-none [&_button[data-slot=prompt-input-submit]]:px-[var(--aifk-space-3)]! [&_button[data-slot=prompt-input-submit]]:text-[length:var(--aifk-type-font-size-xs)]! [&_button[data-slot=prompt-input-submit]]:leading-none! @max-[31rem]:[&_.aifk-prompt-input__toolbar]:grid @max-[31rem]:[&_.aifk-prompt-input__toolbar]:grid-cols-1 @max-[31rem]:[&_.aifk-prompt-input__toolbar]:items-stretch @max-[31rem]:[&_.aifk-prompt-input__toolbar]:ps-0 @max-[31rem]:[&_.aifk-prompt-input__toolbar-start]:min-w-0 @max-[31rem]:[&_.aifk-prompt-input__hint]:hidden @max-[31rem]:[&_.aifk-prompt-input__submit]:w-full @max-[31rem]:[&_.aifk-prompt-input__submit]:rounded-[var(--aifk-radius-control)]",
  "aifk-attachment-composer__sr-only": "aifk-attachment-composer__sr-only absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] [clip:rect(0_0_0_0)]",
};

function classes(name: string, ...values: Array<string | undefined | false>) {
  return [classMap[name] ?? name, ...values].filter(Boolean).join(" ");
}

type AttachmentAction = (attachmentId: string) => void | Promise<void>;

export interface AttachmentComposerSubmit {
  text: string;
  attachmentIds: readonly string[];
}

export interface AttachmentComposerProps {
  attachments: readonly AttachmentUpload[];
  connection: ConnectionState;
  onSubmit(message: AttachmentComposerSubmit): void | Promise<void>;
  onFilesSelected?(files: readonly File[]): void | Promise<void>;
  onReplaceFile?(attachmentId: string, file: File): void | Promise<void>;
  onRetry?: AttachmentAction;
  onCancel?: AttachmentAction;
  onRemove?: AttachmentAction;
  onRetryConnection?(): void | Promise<void>;
  value?: string;
  defaultValue?: string;
  onValueChange?(value: string): void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxFileSize?: number;
  placeholder?: string;
  className?: string;
}

interface PendingFocus {
  id: string;
  index: number;
}

interface ReplaceRequest {
  attachment: AttachmentUpload;
  resolve(): void;
  reject(): void;
}

export function AttachmentComposer({
  attachments,
  connection,
  onSubmit,
  onFilesSelected,
  onReplaceFile,
  onRetry,
  onCancel,
  onRemove,
  onRetryConnection,
  value,
  defaultValue,
  onValueChange,
  accept,
  multiple = true,
  maxFiles,
  maxFileSize,
  placeholder = "Add a message",
  className,
}: AttachmentComposerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const replaceRequestRef = useRef<ReplaceRequest | null>(null);
  const pendingFocusRef = useRef<PendingFocus | null>(null);
  const previousIdsRef = useRef(attachments.map((attachment) => attachment.id));
  const batchPendingRef = useRef(false);
  const [batchPending, setBatchPending] = useState(false);
  const [fileActionError, setFileActionError] = useState<string>();
  const previousConnectionRef = useRef(connection.status);
  const [connectionAnnouncement, setConnectionAnnouncement] = useState("");

  const connected = connection.status === "connected";
  const readyCount = attachments.filter((attachment) => attachment.status === "ready").length;
  const failedAttachments = attachments.filter((attachment) => attachment.status === "failed");
  const attentionCount = attachments.filter((attachment) => attachment.status === "failed" || attachment.status === "cancelled").length;
  const activeCount = attachments.length - readyCount - attentionCount;
  const allReady = attachments.every((attachment) => attachment.status === "ready");

  useEffect(() => {
    const previousIds = previousIdsRef.current;
    const currentIds = attachments.map((attachment) => attachment.id);
    const pending = pendingFocusRef.current;
    if (pending && previousIds.includes(pending.id) && !currentIds.includes(pending.id)) {
      const target = attachments[pending.index] ?? attachments[pending.index - 1];
      if (target) rowRefs.current.get(target.id)?.focus();
      else attachButtonRef.current?.focus();
      pendingFocusRef.current = null;
    }
    previousIdsRef.current = currentIds;
  }, [attachments]);

  useEffect(() => {
    if (connection.status === "connected" && previousConnectionRef.current !== "connected") {
      setConnectionAnnouncement("Connection restored.");
    } else if (connection.status !== "connected") {
      setConnectionAnnouncement("");
    }
    previousConnectionRef.current = connection.status;
  }, [connection.status]);

  useEffect(() => () => {
    replaceRequestRef.current?.resolve();
    replaceRequestRef.current = null;
  }, []);

  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;
    input.addEventListener("cancel", finishReplacePicker);
    return () => input.removeEventListener("cancel", finishReplacePicker);
  }, []);

  function finishReplacePicker() {
    replaceRequestRef.current?.resolve();
    replaceRequestRef.current = null;
  }

  function openAddPicker() {
    const input = fileInputRef.current;
    if (!input || !connected) return;
    finishReplacePicker();
    input.multiple = multiple;
    input.click();
  }

  function openReplacePicker(attachment: AttachmentUpload) {
    const input = fileInputRef.current;
    if (!input || !connected || !onReplaceFile) return Promise.resolve();
    finishReplacePicker();
    input.multiple = false;
    return new Promise<void>((resolve, reject) => {
      replaceRequestRef.current = { attachment, resolve, reject };
      input.click();
    });
  }

  function handleFileSelection(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    const replaceRequest = replaceRequestRef.current;
    event.currentTarget.value = "";
    replaceRequestRef.current = null;
    if (files.length === 0) {
      replaceRequest?.resolve();
      return;
    }
    setFileActionError(undefined);
    if (replaceRequest) {
      const replacement = files[0];
      if (!replacement || !onReplaceFile) {
        replaceRequest.resolve();
        return;
      }
      void Promise.resolve(onReplaceFile(replaceRequest.attachment.id, replacement)).then(replaceRequest.resolve, replaceRequest.reject);
      return;
    }
    if (!onFilesSelected) return;
    const selectedFiles = multiple ? files : files.slice(0, 1);
    if (maxFiles !== undefined && attachments.length + selectedFiles.length > maxFiles) {
      setFileActionError(`You can attach up to ${maxFiles} ${maxFiles === 1 ? "file" : "files"}.`);
      return;
    }
    const oversizedFile = maxFileSize === undefined ? undefined : selectedFiles.find((file) => file.size > maxFileSize);
    if (oversizedFile && maxFileSize !== undefined) {
      setFileActionError(`${oversizedFile.name} is larger than the ${formatFileLimit(maxFileSize)} limit. Choose a smaller file.`);
      return;
    }
    void Promise.resolve(onFilesSelected(selectedFiles)).catch(() => {
      setFileActionError("Files could not be added. Try again.");
    });
  }

  async function removeAttachment(attachment: AttachmentUpload) {
    if (!onRemove) return;
    pendingFocusRef.current = {
      id: attachment.id,
      index: attachments.findIndex((item) => item.id === attachment.id),
    };
    try {
      await onRemove(attachment.id);
    } catch (error) {
      pendingFocusRef.current = null;
      throw error;
    }
  }

  async function removeFailedAttachments() {
    if (!onRemove || batchPendingRef.current) return;
    batchPendingRef.current = true;
    setBatchPending(true);
    setFileActionError(undefined);
    const first = failedAttachments[0];
    if (first) {
      pendingFocusRef.current = {
        id: first.id,
        index: attachments.findIndex((attachment) => attachment.id === first.id),
      };
    }
    try {
      await Promise.all(failedAttachments.map((attachment) => onRemove(attachment.id)));
    } catch {
      pendingFocusRef.current = null;
      setFileActionError("Some failed files could not be removed. Try again.");
    } finally {
      batchPendingRef.current = false;
      setBatchPending(false);
    }
  }

  const canSend = (text: string) => connected && allReady && (Boolean(text.trim()) || attachments.length > 0);

  return (
    <section
      className={classes("aifk-attachment-composer", className)}
      aria-label="Message with attachments"
      data-aifk-pattern="attachment-composer"
      data-connection={connection.status}
      data-blocked={!allReady || !connected || undefined}
    >
      <span className={classes("aifk-attachment-composer__sr-only")} role="status" aria-live="polite" aria-atomic="true">{connectionAnnouncement}</span>
      {connection.status !== "connected" ? (
        <ConnectionPrimitive.Root connection={connection} {...(onRetryConnection ? { onRetry: onRetryConnection } : {})} className={classes("aifk-attachment-composer__connection")}>
          <div>
            <ConnectionPrimitive.Status className={classes("aifk-attachment-composer__connection-status")} />
            <ConnectionPrimitive.Message>
              {connectionMessage(connection.status)}
            </ConnectionPrimitive.Message>
          </div>
          <ConnectionPrimitive.Retry className={classes("aifk-attachment-composer__connection-action")} />
        </ConnectionPrimitive.Root>
      ) : null}

      <div className={classes("aifk-attachment-composer__heading")}>
        <div>
          <h2>Attachments</h2>
          <p>{attachmentSummary(attachments.length, readyCount, activeCount, attentionCount, connection.status)}</p>
        </div>
      </div>

      <input
        ref={fileInputRef}
        className={classes("aifk-attachment-composer__file-input")}
        type="file"
        multiple={multiple}
        accept={accept}
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleFileSelection}
      />

      {attentionCount > 0 ? (
        <div className={classes("aifk-attachment-composer__attention")} role="alert">
          <div>
            <strong>{attentionHeading(attentionCount)}</strong>
            <p>Retry, replace or remove every affected file before sending.</p>
          </div>
          {failedAttachments.length >= 2 && onRemove ? (
            <button type="button" disabled={batchPending} onClick={() => void removeFailedAttachments()}>
              {batchPending ? "Removing failed files" : `Remove ${failedAttachments.length} failed`}
            </button>
          ) : null}
        </div>
      ) : null}

      {fileActionError ? <p className={classes("aifk-attachment-composer__action-error")} role="alert">{fileActionError}</p> : null}

      {attachments.length > 0 ? (
        <ol className={classes("aifk-attachment-composer__list")} aria-label="Attachments queued with this message">
          {attachments.map((attachment, index) => (
            <li
              key={attachment.id}
              ref={(element) => {
                if (element) rowRefs.current.set(attachment.id, element);
                else rowRefs.current.delete(attachment.id);
              }}
              className={classes("aifk-attachment-composer__item")}
              tabIndex={-1}
              aria-label={`${attachment.file.name}, ${attachment.status}`}
            >
              <AttachmentPrimitive.Root
                attachment={attachment}
                connection={connection}
                {...(onRetry ? { onRetry: (item: AttachmentUpload) => onRetry(item.id) } : {})}
                {...(onCancel ? { onCancel: (item: AttachmentUpload) => onCancel(item.id) } : {})}
                {...(onRemove ? { onRemove: removeAttachment } : {})}
                {...(onReplaceFile ? { onReplace: openReplacePicker } : {})}
                className={classes("aifk-attachment-composer__attachment")}
              >
                <File.Root file={fileProjection(attachment)} variant="ghost" size="sm" className={classes("aifk-attachment-composer__file")}>
                  <File.Icon />
                  <File.Details>
                    <File.Name />
                    <div className={classes("aifk-attachment-composer__metadata")}>
                      <File.Size />
                      <AttachmentPrimitive.Status className={classes("aifk-attachment-composer__sr-only")} />
                      <span data-aifk-attachment-status-visual="" aria-hidden="true">{attachmentStatusLabel(attachment, connection.status)}</span>
                    </div>
                    <AttachmentPrimitive.Progress className={classes("aifk-attachment-composer__progress")} />
                    <AttachmentPrimitive.Error className={classes("aifk-attachment-composer__row-error")} />
                  </File.Details>
                </File.Root>
                <AttachmentActions canReplace={Boolean(onReplaceFile)} canRemove={Boolean(onRemove)} />
              </AttachmentPrimitive.Root>
            </li>
          ))}
        </ol>
      ) : (
        <p className={classes("aifk-attachment-composer__empty")}>No files attached. Add a message or choose files to include.</p>
      )}

      <PromptInput
        onSubmit={(text) => onSubmit({ text, attachmentIds: attachments.map((attachment) => attachment.id) })}
        canSubmit={canSend}
        {...(value === undefined ? {} : { value })}
        {...(defaultValue === undefined ? {} : { defaultValue })}
        {...(onValueChange === undefined ? {} : { onValueChange })}
        placeholder={placeholder}
        label="Message"
        hint={composerHint(attachments, connection.status)}
        toolbarStart={
          <button
            ref={attachButtonRef}
            type="button"
            className={classes("aifk-attachment-composer__attach")}
            disabled={!connected || !onFilesSelected}
            onClick={openAddPicker}
          >
            <PlusIcon />
            Attach files
          </button>
        }
        submitLabel="Send message and attachments"
        showSubmitLabel
        submitErrorMessage="Message could not be sent. Your text and files are still here."
        className={classes("aifk-attachment-composer__prompt")}
      />
    </section>
  );
}

function AttachmentActions({ canReplace, canRemove }: { canReplace: boolean; canRemove: boolean }) {
  const { attachment } = useAttachment();
  const recovery = attachment.error?.recovery;
  const active = attachment.status === "uploading" || attachment.status === "retrying" || attachment.status === "paused";
  const removable = attachment.status === "queued" || attachment.status === "ready" || attachment.status === "failed" || attachment.status === "cancelled";
  return (
    <div className={classes("aifk-attachment-composer__actions")} aria-label={`Actions for ${attachment.file.name}`}>
      {attachment.status === "failed" && recovery === "retry" ? <AttachmentPrimitive.Retry>Retry</AttachmentPrimitive.Retry> : null}
      {attachment.status === "failed" && recovery === "replace" && canReplace ? <AttachmentPrimitive.Replace>Choose another</AttachmentPrimitive.Replace> : null}
      {attachment.status === "cancelled" && recovery === "retry" ? <AttachmentPrimitive.Retry>Retry</AttachmentPrimitive.Retry> : null}
      {attachment.status === "paused" ? <AttachmentPrimitive.Retry>Resume</AttachmentPrimitive.Retry> : null}
      {active ? <AttachmentPrimitive.Cancel>Cancel</AttachmentPrimitive.Cancel> : null}
      {removable && canRemove ? <AttachmentPrimitive.Remove>Remove</AttachmentPrimitive.Remove> : null}
    </div>
  );
}

function fileProjection(attachment: AttachmentUpload): FileContentPart {
  const status = attachment.status === "ready"
    ? "ready"
    : attachment.status === "failed" || attachment.status === "cancelled"
      ? "failed"
      : "loading";
  return { ...attachment.file, status };
}

function connectionMessage(status: ConnectionState["status"]) {
  if (status === "offline") return "Uploads are paused and your draft is saved.";
  if (status === "reconnecting") return "Uploads will resume when the connection returns.";
  return "Your draft and attachments are still here. Try the connection again.";
}

function attachmentStatusLabel(attachment: AttachmentUpload, connectionStatus: ConnectionState["status"]) {
  const progress = progressLabel(attachment);
  if (connectionStatus === "offline" && ["queued", "uploading", "retrying"].includes(attachment.status)) return `Paused offline${progress}`;
  if (connectionStatus === "reconnecting" && ["queued", "uploading", "retrying"].includes(attachment.status)) return `Paused while reconnecting${progress}`;
  if (attachment.status === "uploading") return `Uploading${progress}`;
  if (attachment.status === "retrying") return `Retrying upload${progress}`;
  if (attachment.status === "queued") return "Waiting to upload";
  if (attachment.status === "paused") return `Upload paused${progress}`;
  if (attachment.status === "ready") return "Ready";
  if (attachment.status === "cancelled") return "Upload cancelled";
  return "Upload failed";
}

function progressLabel(attachment: AttachmentUpload) {
  const progress = attachment.progress;
  if (!progress || progress.total === undefined || progress.total <= 0) return "";
  const percentage = Math.round((progress.current / progress.total) * 100);
  return ` · ${Math.min(100, Math.max(0, percentage))}%`;
}

function formatFileLimit(bytes: number) {
  if (bytes >= 1024 * 1024) return `${Math.round(bytes / (1024 * 1024))} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} bytes`;
}

function attachmentSummary(total: number, ready: number, active: number, attention: number, status: ConnectionState["status"]) {
  if (total === 0) return "Files stay in this composer until the host confirms removal.";
  const parts = [`${total} ${total === 1 ? "file" : "files"}`, `${ready} ready`];
  if (active > 0) parts.push(`${active} ${status === "connected" ? "in progress" : "paused"}`);
  if (attention > 0) parts.push(`${attention} need attention`);
  return parts.join(" · ");
}

function attentionHeading(count: number) {
  return count === 1 ? "1 file needs attention" : `${count} files need attention`;
}

function composerHint(attachments: readonly AttachmentUpload[], status: ConnectionState["status"]) {
  if (status !== "connected") return "Reconnect before sending";
  if (attachments.some((attachment) => attachment.status !== "ready")) return "Finish or remove every file before sending";
  if (attachments.length > 0) return "Ready files will be sent with this message";
  return "Enter to send";
}

function PlusIcon() {
  return <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>;
}
