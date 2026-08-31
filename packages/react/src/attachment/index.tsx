import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type PropsWithChildren
} from "react";
import type { AttachmentUpload, AttachmentUploadStatus, ConnectionState } from "@aifrontkit/core";

type AttachmentAction = "retry" | "cancel" | "remove" | "replace";
type AttachmentCallback = (attachment: AttachmentUpload) => void | Promise<void>;

interface AttachmentContextValue {
  attachment: AttachmentUpload;
  connection: ConnectionState | undefined;
  effectiveStatus: AttachmentUploadStatus;
  pendingAction: AttachmentAction | null;
  actionError: string | null;
  onRetry: AttachmentCallback | undefined;
  onCancel: AttachmentCallback | undefined;
  onRemove: AttachmentCallback | undefined;
  onReplace: AttachmentCallback | undefined;
  runAction(action: AttachmentAction, callback: AttachmentCallback): Promise<void>;
}

const AttachmentContext = createContext<AttachmentContextValue | null>(null);

export interface AttachmentRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  attachment: AttachmentUpload;
  connection?: ConnectionState;
  onRetry?: AttachmentCallback;
  onCancel?: AttachmentCallback;
  onRemove?: AttachmentCallback;
  onReplace?: AttachmentCallback;
}

const activeStatuses: readonly AttachmentUploadStatus[] = ["queued", "uploading", "retrying"];

function getEffectiveStatus(attachment: AttachmentUpload, connection?: ConnectionState): AttachmentUploadStatus {
  if (connection && (connection.status === "offline" || connection.status === "reconnecting") && activeStatuses.includes(attachment.status)) return "paused";
  return attachment.status;
}

function actionErrorMessage(action: AttachmentAction, filename: string) {
  const verb = action === "retry" ? "retry" : action === "cancel" ? "cancel" : action === "remove" ? "remove" : "replace";
  return `Could not ${verb} ${filename}. Try again.`;
}

function Root({ attachment, connection, onRetry, onCancel, onRemove, onReplace, children, "aria-label": ariaLabel, ...props }: AttachmentRootProps) {
  const effectiveStatus = getEffectiveStatus(attachment, connection);
  const [pendingAction, setPendingAction] = useState<AttachmentAction | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const pendingRef = useRef(false);

  async function runAction(action: AttachmentAction, callback: AttachmentCallback) {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPendingAction(action);
    setActionError(null);
    try {
      await callback(attachment);
    } catch {
      setActionError(actionErrorMessage(action, attachment.file.name));
    } finally {
      pendingRef.current = false;
      setPendingAction(null);
    }
  }

  const busy = activeStatuses.includes(effectiveStatus) || connection?.status === "reconnecting" || pendingAction !== null;
  return (
    <AttachmentContext.Provider value={{ attachment, connection, effectiveStatus, pendingAction, actionError, onRetry, onCancel, onRemove, onReplace, runAction }}>
      <section
        {...props}
        aria-label={ariaLabel ?? `Attachment: ${attachment.file.name}`}
        aria-busy={busy ? "true" : undefined}
        data-aifk-attachment=""
        data-status={attachment.status}
        data-effective-status={effectiveStatus}
        data-recovery={attachment.error?.recovery ?? "none"}
        data-pending-action={pendingAction ?? undefined}
      >
        {children}
      </section>
    </AttachmentContext.Provider>
  );
}

export function useAttachment() {
  const context = useContext(AttachmentContext);
  if (!context) throw new Error("Attachment primitives must be inside AttachmentPrimitive.Root.");
  return context;
}

const statusLabels: Record<AttachmentUploadStatus, string> = {
  queued: "Waiting to upload",
  uploading: "Uploading",
  paused: "Upload paused",
  retrying: "Retrying upload",
  ready: "Ready",
  failed: "Upload failed",
  cancelled: "Upload cancelled"
};

function Status(props: ComponentPropsWithoutRef<"span">) {
  const { effectiveStatus } = useAttachment();
  return <span role="status" aria-atomic="true" data-aifk-attachment-status="" {...props}>{props.children ?? statusLabels[effectiveStatus]}</span>;
}

function Progress(props: ComponentPropsWithoutRef<"progress">) {
  const { attachment } = useAttachment();
  const progress = attachment.progress;
  if (!progress) return null;
  const determinate = progress.total !== undefined && Number.isFinite(progress.total) && progress.total > 0;
  return (
    <progress
      aria-label={`Upload progress for ${attachment.file.name}`}
      data-aifk-attachment-progress=""
      {...props}
      {...(determinate ? { value: Math.min(Math.max(progress.current, 0), progress.total as number), max: progress.total } : {})}
    />
  );
}

function AttachmentError(props: ComponentPropsWithoutRef<"p">) {
  const { attachment, actionError } = useAttachment();
  const message = actionError ?? attachment.error?.message;
  if (!message) return null;
  return <p role="alert" data-aifk-attachment-error="" {...props}>{props.children ?? message}</p>;
}

interface ActionProps extends ComponentPropsWithoutRef<"button"> {
  action: AttachmentAction;
  defaultLabel: string;
}

function Action({ action, defaultLabel, disabled, onClick, ...props }: ActionProps) {
  const context = useAttachment();
  const callback = action === "retry" ? context.onRetry : action === "cancel" ? context.onCancel : action === "remove" ? context.onRemove : context.onReplace;
  const recovery = context.attachment.error?.recovery;
  const connected = !context.connection || context.connection.status === "connected";
  const allowed = action === "retry"
    ? connected && ((context.attachment.status === "failed" && recovery === "retry") || context.attachment.status === "paused" || (context.attachment.status === "cancelled" && recovery === "retry"))
    : action === "replace"
      ? connected && context.attachment.status === "failed" && recovery === "replace"
      : action === "remove"
        ? ["queued", "ready", "failed", "cancelled"].includes(context.attachment.status)
        : activeStatuses.includes(context.attachment.status) || context.attachment.status === "paused";
  const isDisabled = Boolean(disabled) || !callback || !allowed || context.pendingAction !== null;
  const label = `${defaultLabel} ${context.attachment.file.name}`;
  return (
    <button
      {...props}
      type="button"
      aria-label={props["aria-label"] ?? label}
      aria-busy={context.pendingAction === action ? "true" : undefined}
      data-aifk-attachment-action={action}
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !isDisabled && callback) void context.runAction(action, callback);
      }}
    >
      {props.children ?? defaultLabel}
    </button>
  );
}

function Retry(props: ComponentPropsWithoutRef<"button">) {
  return <Action action="retry" defaultLabel="Retry upload" {...props} />;
}

function Cancel(props: ComponentPropsWithoutRef<"button">) {
  return <Action action="cancel" defaultLabel="Cancel upload" {...props} />;
}

function Remove(props: ComponentPropsWithoutRef<"button">) {
  return <Action action="remove" defaultLabel="Remove" {...props} />;
}

function Replace(props: ComponentPropsWithoutRef<"button">) {
  return <Action action="replace" defaultLabel="Choose another file for" {...props} />;
}

export const AttachmentPrimitive = { Root, Status, Progress, Error: AttachmentError, Retry, Cancel, Remove, Replace };
