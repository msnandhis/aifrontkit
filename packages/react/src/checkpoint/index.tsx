import {
  createContext,
  useContext,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type PropsWithChildren,
  type ReactNode
} from "react";
import type { AgentCheckpoint, ConnectionState, TaskStatus } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

export interface CheckpointRestoreIntent {
  checkpointId: string;
  checkpointVersion: number;
  sourceTaskId?: string;
  sourceTaskVersion?: number;
  currentTaskVersion?: number;
}

export type CheckpointRestoreOperation =
  | { status: "idle" }
  | { status: "pending" }
  | { status: "failed"; error: string }
  | { status: "succeeded" };

export type CheckpointRestoreCallback = (intent: CheckpointRestoreIntent) => void | Promise<void>;

export interface CheckpointContextValue {
  checkpoint: AgentCheckpoint;
  currentTaskVersion: number | undefined;
  taskStatus: TaskStatus | undefined;
  connection: ConnectionState | undefined;
  operation: CheckpointRestoreOperation | undefined;
  locallyPending: boolean;
  onRestore: CheckpointRestoreCallback | undefined;
  runRestore(): Promise<void>;
}

const CheckpointContext = createContext<CheckpointContextValue | null>(null);

export interface CheckpointRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  as?: "section" | "div";
  checkpoint?: AgentCheckpoint;
  checkpointId?: string;
  currentTaskVersion?: number;
  taskStatus?: TaskStatus;
  connection?: ConnectionState;
  operation?: CheckpointRestoreOperation;
  onRestore?: CheckpointRestoreCallback;
}

const restoreBlockedTaskStatuses: readonly TaskStatus[] = ["queued", "running", "awaiting-approval", "complete"];

export function createCheckpointRestoreIntent(
  checkpoint: AgentCheckpoint,
  currentTaskVersion?: number
): CheckpointRestoreIntent {
  return {
    checkpointId: checkpoint.id,
    checkpointVersion: checkpoint.version,
    ...(checkpoint.sourceTaskId === undefined ? {} : { sourceTaskId: checkpoint.sourceTaskId }),
    ...(checkpoint.sourceTaskVersion === undefined ? {} : { sourceTaskVersion: checkpoint.sourceTaskVersion }),
    ...(currentTaskVersion === undefined ? {} : { currentTaskVersion })
  };
}

export function isCheckpointRestoreAvailable({
  checkpoint,
  currentTaskVersion,
  taskStatus,
  connection,
  operation,
  locallyPending = false,
  hasRestoreCallback
}: {
  checkpoint: AgentCheckpoint;
  currentTaskVersion?: number | undefined;
  taskStatus?: TaskStatus | undefined;
  connection?: ConnectionState | undefined;
  operation?: CheckpointRestoreOperation | undefined;
  locallyPending?: boolean | undefined;
  hasRestoreCallback: boolean;
}): boolean {
  if (!checkpoint.restorable || checkpoint.status !== "available") return false;
  if (taskStatus && restoreBlockedTaskStatuses.includes(taskStatus)) return false;
  if (
    checkpoint.sourceTaskVersion !== undefined &&
    currentTaskVersion !== undefined &&
    checkpoint.sourceTaskVersion !== currentTaskVersion
  ) return false;
  if (connection && connection.status !== "connected") return false;
  if (operation?.status === "pending" || locallyPending) return false;
  return hasRestoreCallback;
}

function Frame({
  as: Element = "section",
  checkpoint,
  currentTaskVersion,
  taskStatus,
  connection,
  operation,
  onRestore,
  children,
  "aria-label": ariaLabel,
  ...props
}: Omit<CheckpointRootProps, "checkpointId"> & { checkpoint: AgentCheckpoint }) {
  const [locallyPending, setLocallyPending] = useState(false);
  const pendingRef = useRef(false);
  const controlledPending = operation?.status === "pending";

  function canRestore() {
    return isCheckpointRestoreAvailable({
      checkpoint,
      currentTaskVersion,
      taskStatus,
      connection,
      operation,
      locallyPending: pendingRef.current,
      hasRestoreCallback: Boolean(onRestore)
    });
  }

  async function runRestore() {
    if (!onRestore || !canRestore()) return;
    pendingRef.current = true;
    setLocallyPending(true);
    try {
      await onRestore(createCheckpointRestoreIntent(checkpoint, currentTaskVersion));
    } catch {
      // Recovery state remains controlled. A rejection must not become an
      // unhandled Promise or an optimistic checkpoint transition.
    } finally {
      pendingRef.current = false;
      setLocallyPending(false);
    }
  }

  const busy = controlledPending || locallyPending;
  const stale = checkpoint.sourceTaskVersion !== undefined &&
    currentTaskVersion !== undefined &&
    checkpoint.sourceTaskVersion !== currentTaskVersion;

  return (
    <CheckpointContext.Provider value={{ checkpoint, currentTaskVersion, taskStatus, connection, operation, locallyPending, onRestore, runRestore }}>
      <Element
        {...props}
        aria-label={ariaLabel ?? `Checkpoint: ${checkpoint.title}`}
        aria-busy={busy ? "true" : undefined}
        data-aifk-checkpoint=""
        data-status={checkpoint.status}
        data-kind={checkpoint.kind}
        data-restorable={checkpoint.restorable ? "true" : "false"}
        data-stale={stale ? "true" : undefined}
        data-operation={operation?.status}
      >
        {children}
      </Element>
    </CheckpointContext.Provider>
  );
}

function RuntimeRoot({ checkpointId, ...props }: Omit<CheckpointRootProps, "checkpoint"> & { checkpointId: string }) {
  const checkpoint = useRuntimeState((state) => state.checkpoints[checkpointId]);
  if (!checkpoint) throw new Error(`CheckpointPrimitive.Root could not find checkpoint "${checkpointId}" in runtime state.`);
  return <Frame {...props} checkpoint={checkpoint} />;
}

function Root({ checkpoint, checkpointId, ...props }: CheckpointRootProps) {
  if (checkpoint) return <Frame {...props} checkpoint={checkpoint} />;
  if (checkpointId) return <RuntimeRoot {...props} checkpointId={checkpointId} />;
  throw new Error("CheckpointPrimitive.Root requires either `checkpoint` or `checkpointId`.");
}

export interface CheckpointTitleProps extends ComponentPropsWithoutRef<"h3"> {
  as?: "h2" | "h3" | "h4";
}

function Title({ as: Heading = "h3", ...props }: CheckpointTitleProps) {
  const { checkpoint } = useCheckpoint();
  return <Heading data-aifk-checkpoint-title="" {...props}>{props.children ?? checkpoint.title}</Heading>;
}

function Kind(props: ComponentPropsWithoutRef<"span">) {
  const { checkpoint } = useCheckpoint();
  return <span data-aifk-checkpoint-kind="" {...props}>{props.children ?? checkpoint.kind}</span>;
}

function Status(props: ComponentPropsWithoutRef<"span">) {
  const { checkpoint } = useCheckpoint();
  return <span data-aifk-checkpoint-status="" {...props}>{props.children ?? checkpoint.status}</span>;
}

function Summary(props: ComponentPropsWithoutRef<"p">) {
  const { checkpoint } = useCheckpoint();
  if (!checkpoint.summary) return null;
  return <p data-aifk-checkpoint-summary="" {...props}>{props.children ?? checkpoint.summary}</p>;
}

export interface CheckpointTimeProps extends Omit<ComponentPropsWithoutRef<"time">, "dateTime"> {
  format?: (timestamp: number, checkpoint: AgentCheckpoint) => ReactNode;
  dateTime?: string;
}

function defaultTimeLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(timestamp);
}

function CreatedAt({ format, dateTime, ...props }: CheckpointTimeProps) {
  const { checkpoint } = useCheckpoint();
  return (
    <time
      data-aifk-checkpoint-created-at=""
      {...props}
      dateTime={dateTime ?? new Date(checkpoint.createdAt).toISOString()}
    >
      {props.children ?? format?.(checkpoint.createdAt, checkpoint) ?? defaultTimeLabel(checkpoint.createdAt)}
    </time>
  );
}

function Expiry({ format, dateTime, ...props }: CheckpointTimeProps) {
  const { checkpoint } = useCheckpoint();
  if (checkpoint.expiresAt === undefined) return null;
  return (
    <time
      data-aifk-checkpoint-expiry=""
      {...props}
      dateTime={dateTime ?? new Date(checkpoint.expiresAt).toISOString()}
    >
      {props.children ?? format?.(checkpoint.expiresAt, checkpoint) ?? defaultTimeLabel(checkpoint.expiresAt)}
    </time>
  );
}

function CheckpointError(props: ComponentPropsWithoutRef<"p">) {
  const { checkpoint, operation } = useCheckpoint();
  const error = operation?.status === "failed" ? operation.error : checkpoint.error;
  if (!error) return null;
  return <p role="alert" data-aifk-checkpoint-error="" {...props}>{props.children ?? error}</p>;
}

function Restore({ disabled, onClick, ...props }: ComponentPropsWithoutRef<"button">) {
  const context = useCheckpoint();
  const isDisabled = Boolean(disabled) || !isCheckpointRestoreAvailable({
    checkpoint: context.checkpoint,
    currentTaskVersion: context.currentTaskVersion,
    taskStatus: context.taskStatus,
    connection: context.connection,
    operation: context.operation,
    locallyPending: context.locallyPending,
    hasRestoreCallback: Boolean(context.onRestore)
  });
  const busy = context.operation?.status === "pending" || context.locallyPending;
  return (
    <button
      {...props}
      type="button"
      aria-busy={busy ? "true" : undefined}
      data-aifk-checkpoint-restore=""
      disabled={isDisabled}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented && !isDisabled) void context.runRestore();
      }}
    >
      {props.children ?? "Restore checkpoint"}
    </button>
  );
}

export function useCheckpoint() {
  const value = useContext(CheckpointContext);
  if (!value) throw new Error("CheckpointPrimitive component must be inside CheckpointPrimitive.Root.");
  return value;
}

export const CheckpointPrimitive = { Root, Title, Kind, Status, Summary, CreatedAt, Expiry, Error: CheckpointError, Restore };
