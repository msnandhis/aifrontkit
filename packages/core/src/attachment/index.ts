import type { FileContentPart } from "../content/index.js";

/** Composer-local transfer state. This is intentionally separate from transcript file-part state. */
export type AttachmentUploadStatus = "queued" | "uploading" | "paused" | "retrying" | "ready" | "failed" | "cancelled";

export interface AttachmentUploadProgress {
  current: number;
  total?: number;
}

export interface AttachmentUploadError {
  /** A safe, user-facing message. Provider errors should be normalized before reaching the UI. */
  message: string;
  code?: string;
  recovery: "retry" | "replace" | "remove";
}

export type AttachmentUploadFile = Omit<FileContentPart, "id" | "status">;

/** Controlled upload projection owned by a composer host or adapter. */
export interface AttachmentUpload {
  id: string;
  file: AttachmentUploadFile;
  status: AttachmentUploadStatus;
  progress?: AttachmentUploadProgress;
  error?: AttachmentUploadError;
  attempt?: number;
}
