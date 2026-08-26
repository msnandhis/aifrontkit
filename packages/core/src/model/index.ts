export type MessageRole = "user" | "assistant" | "system";
export type MessageStatus = "streaming" | "complete" | "interrupted" | "failed";

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image"; url: string; alt?: string }
  | { type: "file"; url: string; name: string; mediaType?: string };

export interface Message {
  id: string;
  threadId: string;
  role: MessageRole;
  status: MessageStatus;
  parts: ContentPart[];
  createdAt: number;
  completedAt?: number;
  error?: string;
  interruptionReason?: string;
}

export type ToolStatus = "pending" | "running" | "complete" | "failed" | "cancelled";
export interface ToolCall {
  id: string;
  messageId?: string;
  name: string;
  status: ToolStatus;
  input?: unknown;
  output?: unknown;
  error?: string;
}

export interface Approval {
  id: string;
  toolCallId: string;
  summary: string;
  status: "requested" | "approved" | "rejected" | "expired";
}

export interface Artifact {
  id: string;
  title: string;
  kind: string;
  version: number;
  status: "streaming" | "ready" | "failed";
  content?: unknown;
}
