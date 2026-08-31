import type { AttachmentUpload, ConnectionState } from "@aifrontkit/core";
import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  AttachmentComposerFixture,
  attachmentComposerQualityScenarios,
  type AttachmentComposerFixtureId,
} from "../../../../../registry/react/css/patterns/attachment-composer/attachment-composer.fixture.js";

interface AttachmentComposerPlaygroundProps extends PlaygroundRecord {
  scenario: AttachmentComposerFixtureId;
}

const version = "1.0.0";
const defaults: PlaygroundState<AttachmentComposerPlaygroundProps, PlaygroundEnvironment> = {
  props: { scenario: "partial-failure" },
  environment: { ...environmentDefaults },
};

function codeState(scenario: AttachmentComposerFixtureId): {
  attachments: AttachmentUpload[];
  connection: ConnectionState;
  draft: string;
} {
  const ready: AttachmentUpload = { id: "brief", file: { type: "file", name: "product-brief.pdf", mediaType: "application/pdf", size: 248000 }, status: "ready" };
  const failed: AttachmentUpload = { id: "interviews", file: { type: "file", name: "customer-interviews.pdf", mediaType: "application/pdf", size: 248000 }, status: "failed", error: { message: "Upload stopped before the file was ready.", recovery: "retry" } };
  if (scenario === "attachment-only") return { attachments: [ready], connection: { status: "connected", attempt: 0, updatedAt: 100 }, draft: "" };
  if (scenario === "offline-paused") return { attachments: [{ ...ready, id: "field-notes", file: { ...ready.file, name: "field-notes.pdf" }, status: "uploading", progress: { current: 46, total: 100 } }], connection: { status: "offline", attempt: 1, updatedAt: 120 }, draft: "Keep this draft while I reconnect." };
  if (scenario === "reconnecting") return { attachments: [{ ...ready, status: "uploading", progress: { current: 72, total: 100 } }], connection: { status: "reconnecting", attempt: 2, updatedAt: 130 }, draft: "Continue when the connection returns." };
  if (scenario === "connection-failed") return { attachments: [{ ...ready, status: "queued" }], connection: { status: "failed", attempt: 3, updatedAt: 150, error: "Connection could not be restored" }, draft: "Send this after recovery." };
  if (scenario === "replace-required") return { attachments: [{ ...failed, error: { message: "This file cannot be read. Choose an unencrypted copy.", recovery: "replace" } }], connection: { status: "connected", attempt: 0, updatedAt: 100 }, draft: "Use the replacement file instead." };
  if (scenario === "uploading-batch" || scenario === "retrying" || scenario === "cancelling") return { attachments: [{ ...ready, status: scenario === "retrying" ? "retrying" : "uploading", progress: { current: 63, total: 100 } }], connection: { status: "connected", attempt: 0, updatedAt: 100 }, draft: "Summarize this file." };
  if (scenario === "long-batch") return { attachments: [ready, { ...ready, id: "metrics", file: { ...ready.file, name: "東京チーム調査結果.csv" } }, { ...failed, id: "support" }], connection: { status: "connected", attempt: 0, updatedAt: 100 }, draft: "قارن الأدلة ثم لخّص النتائج." };
  return { attachments: scenario === "partial-failure" ? [ready, { ...ready, id: "journey", file: { ...ready.file, name: "customer-journey.pdf" } }, failed] : [ready], connection: { status: "connected", attempt: 0, updatedAt: 100 }, draft: "Find the key risks and next actions." };
}

export const attachmentComposerPlayground = definePlayground<AttachmentComposerPlaygroundProps>({
  id: "attachment-composer",
  version,
  label: "Attachment composer",
  description: "Compose ordered uploads with explicit failure, connection and attachment-only submission boundaries.",
  defaults,
  scenarios: attachmentComposerQualityScenarios.map((scenario) => ({
    id: scenario.id,
    version,
    label: scenario.id.split("-").map((word) => word[0]!.toUpperCase() + word.slice(1)).join(" "),
    description: scenario.expectation,
    values: scenario.id === defaults.props.scenario ? {} : { props: { scenario: scenario.id } },
    testId: `attachment-composer-${scenario.id}`,
  })),
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <AttachmentComposerFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => {
    const typed = state.environment.language === "tsx";
    const initial = codeState(state.props.scenario);
    return [
      'import { useState } from "react";',
      ...(typed ? ['import type { AttachmentUpload, ConnectionState } from "@aifrontkit/core";'] : []),
      'import { AttachmentComposer } from "@/components/aifrontkit/attachment-composer";',
      "",
      `const initialAttachments${typed ? ": AttachmentUpload[]" : ""} = ${JSON.stringify(initial.attachments, null, 2)};`,
      `const initialConnection${typed ? ": ConnectionState" : ""} = ${JSON.stringify(initial.connection, null, 2)};`,
      "",
      "export function AttachmentRecoveryComposer() {",
      "  const [attachments, setAttachments] = useState(initialAttachments);",
      `  const [draft, setDraft] = useState(${JSON.stringify(initial.draft)});`,
      "  const [connection, setConnection] = useState(initialConnection);",
      "",
      "  return (",
      "    <AttachmentComposer",
      "      attachments={attachments}",
      "      connection={connection}",
      "      value={draft}",
      "      onValueChange={setDraft}",
      '      accept=".pdf,.csv,.png"',
      "      maxFiles={6}",
      "      maxFileSize={25 * 1024 * 1024}",
      "      onFilesSelected={(files) => setAttachments((current) => [",
      "        ...current,",
      "        ...files.map((file, index) => ({ id: `selected-${current.length + index}`, file: { type: \"file\", name: file.name, size: file.size, ...(file.type ? { mediaType: file.type } : {}) }, status: \"queued\" })),",
      "      ])}",
      "      onReplaceFile={(attachmentId, file) => setAttachments((current) => current.map((attachment) => attachment.id === attachmentId ? { id: `${attachmentId}-replacement`, file: { type: \"file\", name: file.name, size: file.size }, status: \"queued\" } : attachment))}",
      "      onRetry={(attachmentId) => setAttachments((current) => current.map((attachment) => attachment.id === attachmentId ? { ...attachment, status: \"retrying\" } : attachment))}",
      "      onCancel={(attachmentId) => setAttachments((current) => current.map((attachment) => attachment.id === attachmentId ? { ...attachment, status: \"cancelled\", error: { message: \"Upload cancelled.\", recovery: \"remove\" } } : attachment))}",
      "      onRemove={(attachmentId) => setAttachments((current) => current.filter((attachment) => attachment.id !== attachmentId))}",
      "      onRetryConnection={() => setConnection((current) => ({ ...current, status: \"reconnecting\", updatedAt: Date.now() }))}",
      "      onSubmit={({ text, attachmentIds }) => console.log({ text, attachmentIds })}",
      "    />",
      "  );",
      "}",
    ].join("\n");
  },
});
