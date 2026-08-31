"use client";

import { useEffect, useState } from "react";
import type { AttachmentUpload, AttachmentUploadStatus, ConnectionState } from "@aifrontkit/core";
import { AttachmentComposer } from "./attachment-composer.js";

export type AttachmentComposerFixtureId =
  | "ready"
  | "uploading-batch"
  | "partial-failure"
  | "retrying"
  | "offline-paused"
  | "reconnecting"
  | "replace-required"
  | "cancelling"
  | "attachment-only"
  | "long-batch"
  | "connection-failed";

export const attachmentComposerQualityScenarios: readonly {
  id: AttachmentComposerFixtureId;
  expectation: string;
}[] = [
  { id: "ready", expectation: "Presents confirmed ready files with a clear send boundary and quiet removal actions." },
  { id: "uploading-batch", expectation: "Shows native progress for an ordered batch and blocks send until every retained file is ready." },
  { id: "partial-failure", expectation: "Keeps two ready files beside one retryable failure, blocks send and never silently omits the failed file." },
  { id: "retrying", expectation: "Communicates a retry in progress and prevents duplicate recovery intent." },
  { id: "offline-paused", expectation: "Uses one shared offline notice while preserving draft, order, progress and local cancel actions." },
  { id: "reconnecting", expectation: "Explains automatic continuation without presenting a duplicate retry action." },
  { id: "replace-required", expectation: "Keeps the failed row in place until the host confirms a selected replacement." },
  { id: "cancelling", expectation: "Keeps an active upload visible and exposes cancellation through the primitive action boundary." },
  { id: "attachment-only", expectation: "Allows an empty text submission when at least one retained attachment is ready." },
  { id: "long-batch", expectation: "Contains six mixed-state files, localized text, indeterminate progress and a 120-character name without widening a 375 pixel viewport." },
  { id: "connection-failed", expectation: "Blocks upload and send actions while offering one explicit host-owned connection retry." },
];

const connected: ConnectionState = { status: "connected", attempt: 0, updatedAt: 100 };

function item(
  id: string,
  name: string,
  status: AttachmentUploadStatus,
  options: Partial<AttachmentUpload> = {},
): AttachmentUpload {
  return {
    id,
    file: {
      type: "file",
      name,
      mediaType: name.endsWith(".png") ? "image/png" : name.endsWith(".csv") ? "text/csv" : "application/pdf",
      size: name.endsWith(".png") ? 862_400 : 248_000,
    },
    status,
    ...options,
  };
}

function failed(id: string, name: string, recovery: "retry" | "replace" | "remove", message: string) {
  return item(id, name, "failed", { error: { recovery, message, code: "normalized-upload-error" } });
}

function selectedFile(file: File) {
  return {
    type: "file" as const,
    name: file.name,
    size: file.size,
    ...(file.type ? { mediaType: file.type } : {}),
  };
}

function fixtureState(scenario: AttachmentComposerFixtureId): { attachments: readonly AttachmentUpload[]; connection: ConnectionState; draft: string } {
  if (scenario === "uploading-batch") return {
    connection: connected,
    draft: "Summarize the evidence in these files.",
    attachments: [
      item("quarterly-report", "quarterly-report.pdf", "ready"),
      item("survey-results", "survey-results.csv", "uploading", { progress: { current: 63, total: 100 } }),
      item("workspace-map", "workspace-map.png", "queued"),
    ],
  };
  if (scenario === "partial-failure") return {
    connection: connected,
    draft: "Compare all three source files.",
    attachments: [
      item("brief", "product-brief.pdf", "ready"),
      item("journey", "customer-journey.pdf", "ready"),
      failed("interviews", "customer-interviews.pdf", "retry", "Upload stopped before the file was ready."),
    ],
  };
  if (scenario === "retrying") return {
    connection: connected,
    draft: "Extract the key decisions.",
    attachments: [item("meeting-notes", "meeting-notes.pdf", "retrying", { progress: { current: 28, total: 100 }, attempt: 2 })],
  };
  if (scenario === "offline-paused") return {
    connection: { status: "offline", attempt: 1, updatedAt: 120, reason: "Network unavailable" },
    draft: "Keep this draft while I reconnect.",
    attachments: [
      item("field-notes", "field-notes.pdf", "uploading", { progress: { current: 46, total: 100 } }),
      item("site-photo", "site-photo.png", "queued"),
    ],
  };
  if (scenario === "reconnecting") return {
    connection: { status: "reconnecting", attempt: 2, updatedAt: 130, nextRetryAt: 140 },
    draft: "Continue when the connection returns.",
    attachments: [item("recovery-log", "recovery-log.pdf", "uploading", { progress: { current: 72, total: 100 } })],
  };
  if (scenario === "replace-required") return {
    connection: connected,
    draft: "Use the replacement file instead.",
    attachments: [failed("encrypted-export", "encrypted-export.pdf", "replace", "This file cannot be read. Choose an unencrypted copy.")],
  };
  if (scenario === "cancelling") return {
    connection: connected,
    draft: "Do not include the large scan.",
    attachments: [item("large-scan", "large-research-scan.pdf", "uploading", { progress: { current: 81, total: 100 } })],
  };
  if (scenario === "attachment-only") return {
    connection: connected,
    draft: "",
    attachments: [item("invoice", "invoice-august.pdf", "ready")],
  };
  if (scenario === "long-batch") return {
    connection: connected,
    draft: "قارن الأدلة مع ملاحظات فريق 東京 ثم لخّص النتائج.",
    attachments: [
      item("long-1", "customer-research-interviews-international-enterprise-expansion-program-accessibility-observations-and-follow-up-actions.pdf", "ready"),
      item("long-2", "東京チーム調査結果.csv", "ready"),
      item("long-3", "mobile-checkout-audit.pdf", "uploading", { progress: { current: 64, total: 100 } }),
      item("long-4", "ملاحظات-رحلة-العميل.pdf", "uploading", { progress: { current: 12 } }),
      failed("long-5", "support-ticket-themes.csv", "retry", "Upload stopped before the file was ready."),
      failed("long-6", "encrypted-workspace-map.png", "replace", "This file cannot be read. Choose another copy."),
    ],
  };
  if (scenario === "connection-failed") return {
    connection: { status: "failed", attempt: 3, updatedAt: 150, error: "Connection could not be restored" },
    draft: "Send this after recovery.",
    attachments: [item("release-notes", "release-notes.pdf", "queued")],
  };
  return {
    connection: connected,
    draft: "Find the key risks and next actions.",
    attachments: [
      item("risk-review", "risk-review.pdf", "ready"),
      item("delivery-plan", "delivery-plan.csv", "ready"),
    ],
  };
}

export function AttachmentComposerFixture({ scenario, emit }: { scenario: AttachmentComposerFixtureId; emit?(message: string): void }) {
  const initial = fixtureState(scenario);
  const [attachments, setAttachments] = useState(initial.attachments);
  const [connection, setConnection] = useState(initial.connection);
  const [draft, setDraft] = useState(initial.draft);

  useEffect(() => {
    const next = fixtureState(scenario);
    setAttachments(next.attachments);
    setConnection(next.connection);
    setDraft(next.draft);
  }, [scenario]);

  function update(id: string, transform: (attachment: AttachmentUpload) => AttachmentUpload) {
    setAttachments((current) => current.map((attachment) => attachment.id === id ? transform(attachment) : attachment));
  }

  return (
    <div data-fixture-pattern="attachment-composer" data-fixture-scenario={scenario}>
      <AttachmentComposer
        attachments={attachments}
        connection={connection}
        value={draft}
        onValueChange={setDraft}
        accept=".pdf,.csv,.png"
        onFilesSelected={(files) => {
          emit?.(`onFilesSelected(${files.length})`);
          setAttachments((current) => [
            ...current,
            ...files.map((file, index) => item(`selected-${current.length + index}`, file.name, "queued", {
              file: selectedFile(file),
            })),
          ]);
        }}
        onReplaceFile={(attachmentId, file) => {
          emit?.(`onReplaceFile(${attachmentId}, ${file.name})`);
          setAttachments((current) => {
            const index = current.findIndex((attachment) => attachment.id === attachmentId);
            if (index < 0) return current;
            const replacement = item(`${attachmentId}-replacement`, file.name, "queued", { file: selectedFile(file) });
            return [...current.slice(0, index), replacement, ...current.slice(index + 1)];
          });
        }}
        onRetry={(attachmentId) => {
          emit?.(`onRetry(${attachmentId})`);
          update(attachmentId, (current) => {
            const { error: _error, ...retained } = current;
            return { ...retained, status: "retrying", attempt: (current.attempt ?? 0) + 1, progress: { current: 0, total: current.progress?.total ?? 100 } };
          });
        }}
        onCancel={(attachmentId) => {
          emit?.(`onCancel(${attachmentId})`);
          update(attachmentId, (current) => {
            const { progress: _progress, ...retained } = current;
            return { ...retained, status: "cancelled", error: { recovery: "remove", message: "Upload cancelled." } };
          });
        }}
        onRemove={(attachmentId) => {
          emit?.(`onRemove(${attachmentId})`);
          setAttachments((current) => current.filter((item) => item.id !== attachmentId));
        }}
        onRetryConnection={() => {
          emit?.("onRetryConnection()");
          setConnection((current) => ({ ...current, status: "reconnecting", updatedAt: current.updatedAt + 1 }));
        }}
        onSubmit={({ text, attachmentIds }) => emit?.(`onSubmit(${JSON.stringify(text)}, ${attachmentIds.join("|")})`)}
      />
    </div>
  );
}
