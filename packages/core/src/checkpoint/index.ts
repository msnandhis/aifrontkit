/** Why a restorable point was captured. */
export type AgentCheckpointKind = "automatic" | "manual" | "approval-boundary" | "interruption";

/** Browser-visible lifecycle of a restorable agent checkpoint. */
export type AgentCheckpointStatus =
  | "available"
  | "restoring"
  | "restored"
  | "failed"
  | "expired"
  | "incompatible"
  | "superseded";

/**
 * A provider-neutral, thread-scoped projection of a resumable agent state.
 * `title` is the stable display label. Provider payloads and persistence
 * handles must remain behind the adapter that produces this projection.
 */
export interface AgentCheckpoint {
  /** Opaque checkpoint identity. Applications must not parse this value. */
  id: string;
  /** Optimistic concurrency version for restore intent. */
  version: number;
  /** Stable ordering key assigned when the checkpoint is first observed. */
  sequence: number;
  kind: AgentCheckpointKind;
  title: string;
  status: AgentCheckpointStatus;
  /** Explicit capability flag. Status alone never implies restorability. */
  restorable: boolean;
  createdAt: number;
  updatedAt: number;
  summary?: string;
  sourceTaskId?: string;
  sourceStepId?: string;
  sourceTaskVersion?: number;
  expiresAt?: number;
  completedStepIds?: readonly string[];
  reason?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}
