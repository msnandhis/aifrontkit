"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import type { AgentCheckpoint } from "@aifrontkit/core/checkpoint";
import type { AgentTask, ConnectionState } from "@aifrontkit/core";
import {
  CheckpointPrimitive,
  type CheckpointRestoreCallback,
  type CheckpointRestoreOperation,
} from "@aifrontkit/react/checkpoint";

const classMap = {
  "aifk-checkpoint-recovery": "@container grid w-full min-w-0 gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] p-[var(--aifk-space-4,1rem)] font-[var(--aifk-type-font-family-sans,system-ui)] text-[var(--aifk-text,CanvasText)] [&_*,&]:box-border [&_:is(h2,h3,h4,p)]:m-0 [&_:is(button,input):focus-visible]:outline-2 [&_:is(button,input):focus-visible]:outline-offset-2 [&_:is(button,input):focus-visible]:outline-[var(--aifk-focus,Highlight)] [&_[tabindex='-1']:focus-visible]:outline-2 [&_[tabindex='-1']:focus-visible]:outline-offset-2 [&_[tabindex='-1']:focus-visible]:outline-[var(--aifk-focus,Highlight)] motion-reduce:[&_*,&_*::before,&_*::after]:duration-[0.01ms]! motion-reduce:[&_*,&_*::before,&_*::after]:animate-[0.01ms]!",
  "aifk-checkpoint-recovery__sr-only": "absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] [clip:rect(0_0_0_0)]",
  "aifk-checkpoint-recovery__header": "flex min-w-0 items-start justify-between gap-[var(--aifk-space-3,0.75rem)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-1,0.25rem)] [&_:is(h2,h3)]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_:is(h2,h3)]:font-[var(--aifk-type-font-weight-semibold,600)] [&_:is(h2,h3)]:leading-[var(--aifk-type-line-height-tight,1.25)] [&_p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_p]:[overflow-wrap:anywhere] @max-[30rem]:grid",
  "aifk-checkpoint-recovery__disclosure": "inline-flex min-h-11 shrink-0 items-center gap-[var(--aifk-space-1,0.25rem)] rounded-[var(--aifk-radius-control,0.625rem)] border border-transparent bg-transparent px-[var(--aifk-space-2,0.5rem)] font-[inherit] text-[length:var(--aifk-type-font-size-sm,0.875rem)] font-[var(--aifk-type-font-weight-semibold,600)] text-[var(--aifk-text-muted,GrayText)] transition-[background-color,border-color] duration-[var(--aifk-motion-duration-fast,120ms)] hover:not-disabled:border-[var(--aifk-text-muted,ButtonText)] active:not-disabled:bg-[var(--aifk-surface-subtle,ButtonFace)] disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.5] [&_svg]:transition-transform [&_svg]:duration-[var(--aifk-motion-duration-fast,120ms)] [&_svg]:[stroke-linecap:round] [&_svg]:[stroke-linejoin:round] aria-expanded:[&_svg]:rotate-180 @max-[30rem]:justify-self-start",
  "aifk-checkpoint-recovery__notice": "flex min-w-0 items-center justify-between gap-[var(--aifk-space-3,0.75rem)] border-s-[0.1875rem] border-s-[var(--aifk-warning,CanvasText)] bg-[var(--aifk-surface-subtle,Canvas)] p-[var(--aifk-space-3,0.75rem)] [&>div]:min-w-0 [&_strong]:block [&_strong]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:mt-[var(--aifk-space-1,0.25rem)] [&_p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_p]:[overflow-wrap:anywhere] [&_button]:min-h-11 [&_button]:rounded-[var(--aifk-radius-control,0.625rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface-elevated,Canvas)] [&_button]:px-[var(--aifk-space-3,0.75rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button]:disabled:cursor-not-allowed [&_button]:disabled:opacity-50 forced-colors:border forced-colors:border-s-4 forced-colors:border-[CanvasText] @max-[30rem]:grid @max-[30rem]:[&_button]:w-full",
  "aifk-checkpoint-recovery__error": "grid min-w-0 gap-[var(--aifk-space-1,0.25rem)] border-s-[0.1875rem] border-s-[var(--aifk-destructive,CanvasText)] bg-[var(--aifk-surface-subtle,Canvas)] p-[var(--aifk-space-3,0.75rem)] [&_strong]:block [&_strong]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_p]:[overflow-wrap:anywhere] forced-colors:border forced-colors:border-s-4 forced-colors:border-[CanvasText]",
  "aifk-checkpoint-recovery__summary": "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-[var(--aifk-space-3,0.75rem)] py-[var(--aifk-space-1,0.25rem)] @max-[30rem]:grid-cols-1 @max-[30rem]:items-start",
  "aifk-checkpoint-recovery__summary-main": "grid min-w-0 gap-[var(--aifk-space-1,0.25rem)]",
  "aifk-checkpoint-recovery__eyebrow": "text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[var(--aifk-type-font-weight-medium,500)] text-[var(--aifk-text-subtle,GrayText)]",
  "aifk-checkpoint-recovery__title": "min-w-0 text-[length:var(--aifk-type-font-size-md,1rem)] font-[var(--aifk-type-font-weight-semibold,600)] leading-[var(--aifk-type-line-height-tight,1.25)] [overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__description": "text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] text-[var(--aifk-text-muted,GrayText)] [overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__metadata": "flex min-w-0 flex-wrap gap-x-[var(--aifk-space-3,0.75rem)] gap-y-[var(--aifk-space-1,0.25rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[1.45] text-[var(--aifk-text-subtle,GrayText)] tabular-nums [&>*]:[overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__unavailable": "text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[var(--aifk-type-font-weight-medium,500)] text-[var(--aifk-warning,CanvasText)]",
  "aifk-checkpoint-recovery__actions": "flex min-w-0 flex-wrap justify-end gap-[var(--aifk-space-2,0.5rem)] [&_button]:min-h-11 [&_button]:rounded-[var(--aifk-radius-control,0.625rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface-elevated,Canvas)] [&_button]:px-[var(--aifk-space-3,0.75rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button]:disabled:cursor-not-allowed [&_button]:disabled:opacity-50 @max-[30rem]:grid @max-[30rem]:grid-cols-1 @max-[30rem]:[&_button]:w-full",
  "aifk-checkpoint-recovery__action-wrapper": "contents",
  "aifk-checkpoint-recovery__primary": "border-[var(--aifk-action,Highlight)]! bg-[var(--aifk-action,Highlight)]! text-[var(--aifk-action-foreground,HighlightText)]! forced-colors:border-2! forced-colors:border-[ButtonText]!",
  "aifk-checkpoint-recovery__tertiary": "border-transparent! bg-transparent! text-[var(--aifk-text-muted,GrayText)]!",
  "aifk-checkpoint-recovery__protected": "max-w-80 text-end text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] text-[var(--aifk-text-muted,GrayText)] [overflow-wrap:anywhere] @max-[30rem]:max-w-none @max-[30rem]:text-start",
  "aifk-checkpoint-recovery__history": "min-w-0 border-t border-[var(--aifk-border,ButtonBorder)] [&_fieldset]:m-0 [&_fieldset]:min-w-0 [&_fieldset]:border-0 [&_fieldset]:px-0 [&_fieldset]:pb-0 [&_fieldset]:pt-[var(--aifk-space-2,0.5rem)] [&_legend]:px-0 [&_legend]:py-[var(--aifk-space-1,0.25rem)] [&_legend]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_legend]:font-[var(--aifk-type-font-weight-semibold,600)] [&_legend]:text-[var(--aifk-text-muted,GrayText)] [&_ol]:m-0 [&_ol]:grid [&_ol]:list-none [&_ol]:p-0 [&_li]:min-w-0 [&_li]:border-b [&_li]:border-[var(--aifk-border,ButtonBorder)] [&_li:last-child]:border-b-0 forced-colors:[&_li[data-usable=true]]:border-s-2 forced-colors:[&_li[data-usable=true]]:border-s-[Highlight]",
  "aifk-checkpoint-recovery__row": "grid min-w-0 grid-cols-[2.75rem_minmax(0,1fr)] items-center",
  "aifk-checkpoint-recovery__radio-target": "grid min-h-11 cursor-pointer place-items-center self-stretch [&_input]:m-0 [&_input]:size-[1.125rem] [&_input]:justify-self-center [&_input]:accent-[var(--aifk-accent,Highlight)]",
  "aifk-checkpoint-recovery__row-content": "grid min-w-0 gap-[var(--aifk-space-1,0.25rem)] py-[var(--aifk-space-3,0.75rem)]",
  "aifk-checkpoint-recovery__row-title": "min-w-0 text-[length:var(--aifk-type-font-size-sm,0.875rem)] font-[var(--aifk-type-font-weight-medium,500)] leading-[1.4] [overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__row-meta": "flex min-w-0 flex-wrap gap-x-[var(--aifk-space-3,0.75rem)] gap-y-[var(--aifk-space-1,0.25rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[1.45] text-[var(--aifk-text-subtle,GrayText)] tabular-nums [&>*]:[overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__history-unavailable": "grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-[var(--aifk-space-3,0.75rem)] ps-11 [&>span]:max-w-48 [&>span]:text-end [&>span]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&>span]:leading-[1.4] [&>span]:text-[var(--aifk-text-subtle,GrayText)] [&>span]:[overflow-wrap:anywhere] @max-[30rem]:grid-cols-1 @max-[30rem]:gap-0 @max-[30rem]:[&>span]:max-w-none @max-[30rem]:[&>span]:pb-[var(--aifk-space-3,0.75rem)] @max-[30rem]:[&>span]:text-start",
  "aifk-checkpoint-recovery__confirmation": "grid min-w-0 gap-[var(--aifk-space-3,0.75rem)] border-s-[0.1875rem] border-s-[var(--aifk-warning,CanvasText)] bg-[var(--aifk-surface-subtle,Canvas)] p-[var(--aifk-space-4,1rem)] [&>div:first-child]:grid [&>div:first-child]:min-w-0 [&>div:first-child]:gap-[var(--aifk-space-1,0.25rem)] [&_:is(h3,h4)]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_:is(h3,h4)]:[overflow-wrap:anywhere] [&_p]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_p]:[overflow-wrap:anywhere]",
  "aifk-checkpoint-recovery__confirmation-actions": "flex flex-wrap justify-end gap-[var(--aifk-space-2,0.5rem)] [&_button]:min-h-11 [&_button]:rounded-[var(--aifk-radius-control,0.625rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface-elevated,Canvas)] [&_button]:px-[var(--aifk-space-3,0.75rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button:last-child]:border-[var(--aifk-action,Highlight)] [&_button:last-child]:bg-[var(--aifk-action,Highlight)] [&_button:last-child]:text-[var(--aifk-action-foreground,HighlightText)] forced-colors:[&_button:last-child]:border-2 forced-colors:[&_button:last-child]:border-[ButtonText] @max-[30rem]:grid @max-[30rem]:grid-cols-1 @max-[30rem]:[&_button]:w-full",
  "aifk-checkpoint-recovery__empty": "text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] text-[var(--aifk-text-muted,GrayText)] [overflow-wrap:anywhere]",
} as const;

function classes(name: keyof typeof classMap, ...values: Array<string | undefined | false>) {
  return [name, classMap[name], ...values].filter(Boolean).join(" ");
}

export type CheckpointRecoveryAction = "resume" | "restore" | "restart";

export interface TaskRestartIntent {
  taskId: string;
  expectedTaskVersion: number;
}

export type CheckpointRecoveryOperation =
  | { status: "idle"; action?: CheckpointRecoveryAction; checkpointId?: string }
  | { status: "pending"; action: CheckpointRecoveryAction; checkpointId?: string }
  | { status: "succeeded"; action: CheckpointRecoveryAction; checkpointId?: string }
  | { status: "failed"; action: CheckpointRecoveryAction; checkpointId?: string; error: string };

export interface CheckpointRecoveryProps {
  task: AgentTask;
  currentTaskVersion: number;
  checkpoints: readonly AgentCheckpoint[];
  connection?: ConnectionState;
  operation: CheckpointRecoveryOperation;
  selectedCheckpointId?: string;
  defaultSelectedCheckpointId?: string;
  onSelectedCheckpointChange?(checkpointId: string): void;
  onRestoreCheckpoint?: CheckpointRestoreCallback;
  onResumeTask?(taskId: string): void | Promise<void>;
  onRestartTask?(intent: TaskRestartIntent): void | Promise<void>;
  onRetryConnection?(): void | Promise<void>;
  showConnectionNotice?: boolean;
  headingLevel?: 2 | 3;
  formatTimestamp?(timestamp: number, checkpoint: AgentCheckpoint): ReactNode;
  className?: string;
}

type Confirmation =
  | { action: "restore"; checkpoint: AgentCheckpoint }
  | { action: "restart" };

const protectedStatuses = ["queued", "running", "awaiting-approval"] as const;

export function CheckpointRecovery({
  task,
  currentTaskVersion,
  checkpoints,
  connection,
  operation,
  selectedCheckpointId,
  defaultSelectedCheckpointId,
  onSelectedCheckpointChange,
  onRestoreCheckpoint,
  onResumeTask,
  onRestartTask,
  onRetryConnection,
  showConnectionNotice = true,
  headingLevel = 2,
  formatTimestamp,
  className,
}: CheckpointRecoveryProps) {
  const SectionHeading = headingLevel === 2 ? "h2" : "h3";
  const DetailHeading = headingLevel === 2 ? "h3" : "h4";
  const historyId = useId();
  const dialogTitleId = useId();
  const dialogDescriptionId = useId();
  const [historyOpen, setHistoryOpen] = useState(false);
  const sorted = useMemo(() => sortCheckpoints(checkpoints), [checkpoints]);
  const usable = useMemo(
    () => sorted.filter((checkpoint) => isUsableCheckpoint(checkpoint, task.id, currentTaskVersion)),
    [currentTaskVersion, sorted, task.id],
  );
  const newestUsable = usable[0];
  const initialSelection = defaultSelectedCheckpointId ?? newestUsable?.id ?? sorted[0]?.id;
  const [internalSelection, setInternalSelection] = useState(initialSelection);
  const requestedSelection = selectedCheckpointId ?? internalSelection;
  const requestedIsUsable = usable.some((checkpoint) => checkpoint.id === requestedSelection);
  const effectiveSelection = requestedIsUsable ? requestedSelection : newestUsable?.id;
  const selected = sorted.find((checkpoint) => checkpoint.id === effectiveSelection) ?? sorted[0];
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [announcement, setAnnouncement] = useState("");
  const selectionRecoveryRef = useRef("");
  const operationAnnouncementRef = useRef("");
  const failureFocusRef = useRef("");
  const errorRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerRef = useRef<HTMLSpanElement>(null);
  const restartTriggerRef = useRef<HTMLButtonElement>(null);
  const connected = !connection || connection.status === "connected";
  const pending = operation.status === "pending";
  const protectedTask = protectedStatuses.some((status) => status === task.status);

  useEffect(() => {
    if (!requestedSelection || requestedIsUsable) {
      selectionRecoveryRef.current = "";
      return;
    }
    const signature = `${requestedSelection}:${newestUsable?.id ?? "none"}`;
    if (selectionRecoveryRef.current === signature) return;
    selectionRecoveryRef.current = signature;
    if (newestUsable) {
      if (selectedCheckpointId === undefined) setInternalSelection(newestUsable.id);
      onSelectedCheckpointChange?.(newestUsable.id);
      setAnnouncement("The selected saved point is no longer available. The newest usable saved point is selected.");
    } else {
      setAnnouncement("The selected saved point is no longer available.");
    }
  }, [newestUsable, onSelectedCheckpointChange, requestedIsUsable, requestedSelection, selectedCheckpointId]);

  useEffect(() => {
    if (operation.status !== "succeeded") return;
    const signature = `${operation.status}:${operation.action}:${operation.checkpointId ?? "task"}`;
    if (operationAnnouncementRef.current === signature) return;
    operationAnnouncementRef.current = signature;
    setHistoryOpen(false);
    setAnnouncement(successMessage(operation.action));
  }, [operation]);

  useEffect(() => {
    if (operation.status !== "failed") {
      failureFocusRef.current = "";
      return;
    }
    const signature = `${operation.action}:${operation.checkpointId ?? "task"}:${operation.error}`;
    if (failureFocusRef.current === signature) return;
    failureFocusRef.current = signature;
    errorRef.current?.focus();
  }, [operation]);

  useEffect(() => {
    if (confirmation) cancelRef.current?.focus();
  }, [confirmation]);

  function selectCheckpoint(checkpointId: string) {
    if (selectedCheckpointId === undefined) setInternalSelection(checkpointId);
    onSelectedCheckpointChange?.(checkpointId);
  }

  function closeConfirmation(restoreFocus = true) {
    const action = confirmation?.action;
    setConfirmation(undefined);
    if (!restoreFocus) return;
    requestAnimationFrame(() => {
      if (action === "restore") restoreTriggerRef.current?.querySelector("button")?.focus();
      if (action === "restart") restartTriggerRef.current?.focus();
    });
  }

  function confirmAction() {
    if (!confirmation || pending || !connected) return;
    if (confirmation.action === "restore") {
      runControlledIntent(() => onRestoreCheckpoint?.({
        checkpointId: confirmation.checkpoint.id,
        checkpointVersion: confirmation.checkpoint.version,
        ...(confirmation.checkpoint.sourceTaskId ? { sourceTaskId: confirmation.checkpoint.sourceTaskId } : {}),
        ...(confirmation.checkpoint.sourceTaskVersion ? { sourceTaskVersion: confirmation.checkpoint.sourceTaskVersion } : {}),
        currentTaskVersion,
      }));
    } else {
      runControlledIntent(() => onRestartTask?.({ taskId: task.id, expectedTaskVersion: currentTaskVersion }));
    }
    closeConfirmation(false);
  }

  function handleDialogKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape") return;
    event.preventDefault();
    closeConfirmation();
  }

  const primitiveOperation = toPrimitiveOperation(operation, selected?.id);
  const selectedUsable = Boolean(selected && isUsableCheckpoint(selected, task.id, currentTaskVersion));
  const restoreVisible = selectedUsable && Boolean(onRestoreCheckpoint) && !protectedTask && task.status !== "complete";
  const restoreAvailable = restoreVisible && connected && !pending;
  const resumeAvailable = task.status === "paused" && Boolean(onResumeTask);

  return (
    <section
      className={classes("aifk-checkpoint-recovery", className)}
      aria-labelledby={`${historyId}-heading`}
      data-aifk-pattern="checkpoint-recovery"
      data-task-status={task.status}
      data-connection={connection?.status ?? "connected"}
    >
      <span className={classes("aifk-checkpoint-recovery__sr-only")} role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>

      <header className={classes("aifk-checkpoint-recovery__header")}>
        <div>
          <SectionHeading id={`${historyId}-heading`}>Saved progress</SectionHeading>
          <p>{sectionSummary(task.status, usable.length, sorted.length)}</p>
        </div>
        {sorted.length > 1 ? (
          <button
            type="button"
            className={classes("aifk-checkpoint-recovery__disclosure")}
            aria-expanded={historyOpen}
            aria-controls={historyId}
            data-action="toggle-history"
            onClick={() => setHistoryOpen((value) => !value)}
          >
            {historyOpen ? "Hide history" : `Show history (${sorted.length})`}
            <ChevronIcon />
          </button>
        ) : null}
      </header>

      {showConnectionNotice && connection && connection.status !== "connected" ? (
        <div className={classes("aifk-checkpoint-recovery__notice")} role="status">
          <div>
            <strong>{connectionHeading(connection.status)}</strong>
            <p>{connectionMessage(connection.status)}</p>
          </div>
          {connection.status === "failed" && onRetryConnection ? (
            <button type="button" data-action="retry-connection" disabled={pending} onClick={() => runControlledIntent(onRetryConnection)}>Retry connection</button>
          ) : null}
        </div>
      ) : null}

      {operation.status === "failed" ? (
        <div
          ref={errorRef}
          className={classes("aifk-checkpoint-recovery__error")}
          role="alert"
          tabIndex={-1}
        >
          <strong>{failureHeading(operation.action)}</strong>
          <p>{operation.error}</p>
        </div>
      ) : null}

      {selected ? (
        <CheckpointPrimitive.Root
          as="div"
          checkpoint={selected}
          currentTaskVersion={currentTaskVersion}
          taskStatus={task.status}
          {...(connection ? { connection } : {})}
          operation={primitiveOperation}
          {...(onRestoreCheckpoint ? { onRestore: onRestoreCheckpoint } : {})}
          className={classes("aifk-checkpoint-recovery__summary")}
        >
          <div className={classes("aifk-checkpoint-recovery__summary-main")}>
            <span className={classes("aifk-checkpoint-recovery__eyebrow")}>
              {selected.id === newestUsable?.id ? "Latest saved point" : "Selected saved point"}
            </span>
            <CheckpointPrimitive.Title as={DetailHeading} className={classes("aifk-checkpoint-recovery__title")} />
            <CheckpointPrimitive.Summary className={classes("aifk-checkpoint-recovery__description")} />
            <div className={classes("aifk-checkpoint-recovery__metadata")}>
              <span>{kindLabel(selected.kind)}</span>
              <CheckpointPrimitive.CreatedAt {...(formatTimestamp ? { format: formatTimestamp } : {})} />
              <span>{milestoneLabel(selected.completedStepIds?.length ?? 0)}</span>
            </div>
            {!selectedUsable ? <p className={classes("aifk-checkpoint-recovery__unavailable")}>{unavailableReason(selected, task.id, currentTaskVersion)}</p> : null}
          </div>

          <RecoveryActions
            task={task}
            selected={selected}
            newestUsable={newestUsable}
            connected={connected}
            pending={pending}
            protectedTask={protectedTask}
            restoreAvailable={restoreAvailable}
            restoreVisible={restoreVisible}
            resumeAvailable={resumeAvailable}
            operation={operation}
            restoreTriggerRef={restoreTriggerRef}
            restartTriggerRef={restartTriggerRef}
            onResumeTask={onResumeTask}
            onRestartTask={onRestartTask}
            onRequestConfirmation={setConfirmation}
          />
        </CheckpointPrimitive.Root>
      ) : (
        <p className={classes("aifk-checkpoint-recovery__empty")}>No saved progress is available for this task yet.</p>
      )}

      {historyOpen ? (
        <div id={historyId} className={classes("aifk-checkpoint-recovery__history")}>
          <fieldset>
            <legend>Saved point history</legend>
            <ol>
              {sorted.map((checkpoint) => {
                const checkpointUsable = isUsableCheckpoint(checkpoint, task.id, currentTaskVersion);
                return (
                  <li key={checkpoint.id} data-usable={checkpointUsable || undefined} data-status={checkpoint.status}>
                    {checkpointUsable ? (
                      <CheckpointHistoryChoice
                        checkpoint={checkpoint}
                        checked={checkpoint.id === selected?.id}
                        groupName={`${historyId}-selection`}
                        formatTimestamp={formatTimestamp}
                        onSelect={selectCheckpoint}
                      />
                    ) : (
                      <CheckpointPrimitive.Root as="div" checkpoint={checkpoint} className={classes("aifk-checkpoint-recovery__history-unavailable")}>
                        <CheckpointRowContent checkpoint={checkpoint} formatTimestamp={formatTimestamp} />
                        <span>{unavailableReason(checkpoint, task.id, currentTaskVersion)}</span>
                      </CheckpointPrimitive.Root>
                    )}
                  </li>
                );
              })}
            </ol>
          </fieldset>
        </div>
      ) : null}

      {confirmation ? (
        <div
          className={classes("aifk-checkpoint-recovery__confirmation")}
          role="alertdialog"
          aria-labelledby={dialogTitleId}
          aria-describedby={dialogDescriptionId}
          onKeyDown={handleDialogKeyDown}
        >
          <div>
            <DetailHeading id={dialogTitleId}>{confirmation.action === "restart" ? "Start this task again?" : "Restore this older saved point?"}</DetailHeading>
            <p id={dialogDescriptionId}>
              {confirmation.action === "restart"
                ? "This starts a new run. The current task evidence and saved history stay visible until the host confirms the change."
                : `This returns the task to “${confirmation.checkpoint.title}”. Newer saved progress remains in history.`}
            </p>
          </div>
          <div className={classes("aifk-checkpoint-recovery__confirmation-actions")}>
            <button ref={cancelRef} type="button" data-action="cancel-confirmation" onClick={() => closeConfirmation()}>Cancel</button>
            <button type="button" data-action="confirm-recovery" disabled={!connected || pending} onClick={confirmAction}>
              {confirmation.action === "restart" ? "Start new run" : "Restore older point"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function RecoveryActions({
  task,
  selected,
  newestUsable,
  connected,
  pending,
  protectedTask,
  restoreAvailable,
  restoreVisible,
  resumeAvailable,
  operation,
  restoreTriggerRef,
  restartTriggerRef,
  onResumeTask,
  onRestartTask,
  onRequestConfirmation,
}: {
  task: AgentTask;
  selected: AgentCheckpoint;
  newestUsable: AgentCheckpoint | undefined;
  connected: boolean;
  pending: boolean;
  protectedTask: boolean;
  restoreAvailable: boolean;
  restoreVisible: boolean;
  resumeAvailable: boolean;
  operation: CheckpointRecoveryOperation;
  restoreTriggerRef: RefObject<HTMLSpanElement | null>;
  restartTriggerRef: RefObject<HTMLButtonElement | null>;
  onResumeTask: CheckpointRecoveryProps["onResumeTask"];
  onRestartTask: CheckpointRecoveryProps["onRestartTask"];
  onRequestConfirmation(confirmation: Confirmation): void;
}) {
  if (protectedTask) {
    return <p className={classes("aifk-checkpoint-recovery__protected")}>{protectedMessage(task.status)}</p>;
  }

  if (operation.status === "succeeded") {
    return <p className={classes("aifk-checkpoint-recovery__protected")}>{successMessage(operation.action)}</p>;
  }

  const resumePrimary = task.status === "paused" && resumeAvailable;
  const restorePrimary = !resumePrimary && restoreVisible && (task.status === "paused" || task.status === "failed" || task.status === "cancelled");
  const mayRestore = restoreVisible && task.status !== "complete";

  return (
    <div className={classes("aifk-checkpoint-recovery__actions")}>
      {resumePrimary ? (
        <button
          type="button"
          className={classes("aifk-checkpoint-recovery__primary")}
          disabled={!connected || pending}
          aria-busy={pending && operation.action === "resume" || undefined}
          data-action="resume"
          onClick={() => runControlledIntent(() => onResumeTask?.(task.id))}
        >
          {pending && operation.action === "resume" ? "Resuming" : "Resume task"}
        </button>
      ) : null}

      {mayRestore ? (
        <span ref={restoreTriggerRef} className={classes("aifk-checkpoint-recovery__action-wrapper")}>
          <CheckpointPrimitive.Restore
            data-action="restore"
            className={restorePrimary ? classes("aifk-checkpoint-recovery__primary") : undefined}
            disabled={!restoreAvailable}
            aria-busy={pending && operation.action === "restore" || undefined}
            onClick={(event) => {
              if (selected.id !== newestUsable?.id) {
                event.preventDefault();
                onRequestConfirmation({ action: "restore", checkpoint: selected });
              }
            }}
          >
            {pending && operation.action === "restore" ? "Restoring" : selected.id === newestUsable?.id ? "Restore latest" : "Restore selected"}
          </CheckpointPrimitive.Restore>
        </span>
      ) : null}

      {onRestartTask ? (
        <button
          ref={restartTriggerRef}
          type="button"
          data-action="restart"
          className={classes("aifk-checkpoint-recovery__tertiary")}
          disabled={!connected || pending}
          onClick={() => onRequestConfirmation({ action: "restart" })}
        >
          {task.status === "complete" ? "Run again" : "Restart"}
        </button>
      ) : null}
    </div>
  );
}

function CheckpointHistoryChoice({
  checkpoint,
  checked,
  groupName,
  formatTimestamp,
  onSelect,
}: {
  checkpoint: AgentCheckpoint;
  checked: boolean;
  groupName: string;
  formatTimestamp: CheckpointRecoveryProps["formatTimestamp"];
  onSelect(checkpointId: string): void;
}) {
  const titleId = useId();
  return (
    <CheckpointPrimitive.Root as="div" checkpoint={checkpoint} className={classes("aifk-checkpoint-recovery__row")}>
      <label className={classes("aifk-checkpoint-recovery__radio-target")}>
        <input
          type="radio"
          name={groupName}
          value={checkpoint.id}
          checked={checked}
          aria-labelledby={titleId}
          onChange={() => onSelect(checkpoint.id)}
        />
      </label>
      <CheckpointRowContent checkpoint={checkpoint} formatTimestamp={formatTimestamp} titleId={titleId} />
    </CheckpointPrimitive.Root>
  );
}

function CheckpointRowContent({ checkpoint, formatTimestamp, titleId }: { checkpoint: AgentCheckpoint; formatTimestamp: CheckpointRecoveryProps["formatTimestamp"]; titleId?: string }) {
  return (
    <div className={classes("aifk-checkpoint-recovery__row-content")}>
      <CheckpointPrimitive.Title id={titleId} as="h4" className={classes("aifk-checkpoint-recovery__row-title")} />
      <div className={classes("aifk-checkpoint-recovery__row-meta")}>
        <span>{kindLabel(checkpoint.kind)}</span>
        <CheckpointPrimitive.CreatedAt {...(formatTimestamp ? { format: formatTimestamp } : {})} />
        <span>{milestoneLabel(checkpoint.completedStepIds?.length ?? 0)}</span>
      </div>
    </div>
  );
}

export function sortCheckpoints(checkpoints: readonly AgentCheckpoint[]): AgentCheckpoint[] {
  return checkpoints
    .map((checkpoint, index) => ({ checkpoint, index }))
    .sort((left, right) => right.checkpoint.sequence - left.checkpoint.sequence || left.index - right.index)
    .map(({ checkpoint }) => checkpoint);
}

export function isUsableCheckpoint(checkpoint: AgentCheckpoint, taskId: string, currentTaskVersion: number): boolean {
  if (!checkpoint.restorable || checkpoint.status !== "available") return false;
  if (checkpoint.sourceTaskId !== undefined && checkpoint.sourceTaskId !== taskId) return false;
  if (checkpoint.sourceTaskVersion !== undefined && checkpoint.sourceTaskVersion !== currentTaskVersion) return false;
  return true;
}

function runControlledIntent(callback: (() => void | Promise<void>) | undefined) {
  if (!callback) return;
  try {
    void Promise.resolve(callback()).catch(() => {
      // Task, connection and recovery failures remain controlled host state.
    });
  } catch {
    // Synchronous host failures follow the same controlled operation boundary.
  }
}

function toPrimitiveOperation(operation: CheckpointRecoveryOperation, selectedCheckpointId?: string): CheckpointRestoreOperation {
  if (operation.action && operation.action !== "restore") return { status: "idle" };
  if (operation.checkpointId && selectedCheckpointId && operation.checkpointId !== selectedCheckpointId) return { status: "idle" };
  if (operation.status === "failed") return { status: "failed", error: operation.error };
  return { status: operation.status };
}

function sectionSummary(taskStatus: AgentTask["status"], usableCount: number, totalCount: number) {
  if (totalCount === 0) return "Recovery points appear here when the agent saves progress.";
  if (taskStatus === "complete") return `${totalCount} ${totalCount === 1 ? "saved point" : "saved points"} kept as run history.`;
  if (usableCount === 0) return "History is preserved, but no saved point can restore this task version.";
  return `${usableCount} ${usableCount === 1 ? "saved point is" : "saved points are"} ready if recovery is needed.`;
}

function milestoneLabel(count: number) {
  return `${count} completed ${count === 1 ? "milestone" : "milestones"}`;
}

function kindLabel(kind: AgentCheckpoint["kind"]) {
  if (kind === "approval-boundary") return "Before approval";
  if (kind === "interruption") return "Interruption save";
  return kind === "manual" ? "Manual save" : "Automatic save";
}

function unavailableReason(checkpoint: AgentCheckpoint, taskId: string, currentTaskVersion: number) {
  if (checkpoint.status === "expired") return "Expired";
  if (checkpoint.status === "incompatible") return checkpoint.reason ?? "Incompatible with this app version";
  if (checkpoint.status === "superseded") return "Replaced by a newer saved point";
  if (checkpoint.status === "failed") return checkpoint.error ?? "Save failed";
  if (checkpoint.sourceTaskId && checkpoint.sourceTaskId !== taskId) return "Belongs to another task";
  if (checkpoint.sourceTaskVersion && checkpoint.sourceTaskVersion !== currentTaskVersion) return "Saved for an earlier task version";
  if (!checkpoint.restorable) return checkpoint.reason ?? "Not available for restore";
  return checkpoint.status === "restoring" ? "Restore in progress" : "Already restored";
}

function protectedMessage(status: AgentTask["status"]) {
  if (status === "awaiting-approval") return "Saved progress is protected while this task waits for approval.";
  if (status === "queued") return "Saved progress is protected while this task waits to start.";
  return "Saved progress is protected while this task is running.";
}

function connectionHeading(status: ConnectionState["status"]) {
  if (status === "offline") return "You are offline";
  if (status === "reconnecting") return "Reconnecting";
  return "Connection unavailable";
}

function connectionMessage(status: ConnectionState["status"]) {
  if (status === "offline") return "Saved history and your selection stay here. Recovery actions need a connection.";
  if (status === "reconnecting") return "Recovery actions stay paused. Nothing restores automatically when the connection returns.";
  return "Recovery actions are paused. Retry the connection when you are ready.";
}

function failureHeading(action: CheckpointRecoveryAction) {
  if (action === "resume") return "Task did not resume";
  if (action === "restart") return "Task did not restart";
  return "Saved progress was not restored";
}

function successMessage(action: CheckpointRecoveryAction) {
  if (action === "resume") return "Task resumed.";
  if (action === "restart") return "New run started.";
  return "Saved progress restored.";
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="m4 6 4 4 4-4" />
    </svg>
  );
}
