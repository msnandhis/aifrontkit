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
import styles from "./attachment-composer.module.css";

function classes(name: string, ...values: Array<string | undefined | false>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
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
