import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createRuntime, type Artifact, type AttachmentUpload, type Message } from "@aifrontkit/core";
import { AIFrontKitProvider, ApprovalPrimitive, ArtifactPrimitive, AttachmentPrimitive, ComposerPrimitive, ConnectionPrimitive, ConversationPrimitive, MessagePrimitive, TaskPrimitive, ThemeProvider, ToolPrimitive } from "../src/index.js";

describe("React primitives", () => {
  it("renders normalized runtime state without owning visual styling", () => {
    const runtime = createRuntime("thread-1", [
      { schemaVersion: 1, id: "1", threadId: "thread-1", timestamp: 1, type: "message.started", messageId: "m1", role: "assistant" },
      { schemaVersion: 1, id: "2", threadId: "thread-1", timestamp: 2, type: "message.delta", messageId: "m1", delta: "Hello" }
    ]);
    const html = renderToStaticMarkup(<AIFrontKitProvider runtime={runtime}><MessagePrimitive.Root messageId="m1"><MessagePrimitive.Content /><MessagePrimitive.Status /></MessagePrimitive.Root></AIFrontKitProvider>);
    expect(html).toContain("Hello");
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-role="assistant"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-atomic="true"');
    expect(html).not.toContain('aria-live="assertive"');
  });

  it("renders role and a failure alert from normalized state", () => {
    const runtime = createRuntime("thread-1", [
      { schemaVersion: 1, id: "1", threadId: "thread-1", timestamp: 1, type: "message.started", messageId: "m2", role: "user" },
      { schemaVersion: 1, id: "2", threadId: "thread-1", timestamp: 2, type: "message.delta", messageId: "m2", delta: "A very long response" },
      { schemaVersion: 1, id: "3", threadId: "thread-1", timestamp: 3, type: "message.failed", messageId: "m2", error: "Connection lost" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <MessagePrimitive.Root messageId="m2">
          <MessagePrimitive.Role />
          <MessagePrimitive.Content />
          <MessagePrimitive.Error />
          <MessagePrimitive.Status />
        </MessagePrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="User message"');
    expect(html).toContain('data-status="failed"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Connection lost");
    expect(html).toContain("Response failed");
  });

  it("does not render when the requested message is absent", () => {
    const runtime = createRuntime("thread-1");
    const html = renderToStaticMarkup(<AIFrontKitProvider runtime={runtime}><MessagePrimitive.Root messageId="missing" /></AIFrontKitProvider>);
    expect(html).toBe("");
  });

  it("renders controlled messages and injects typed content-part renderers", () => {
    const message: Message = {
      id: "controlled", threadId: "controlled", role: "assistant", status: "complete",
      parts: [{ type: "text" as const, text: "Replace me" }, { type: "file" as const, name: "report.pdf", source: { kind: "id" as const, id: "file_1" } }], createdAt: 1
    };
    const html = renderToStaticMarkup(
      <MessagePrimitive.Root message={message}>
        <MessagePrimitive.Content>
          <MessagePrimitive.Parts components={{
            text: ({ part }) => <strong>{part.text}</strong>,
            file: ({ part }) => <em>{part.name}</em>
          }} />
        </MessagePrimitive.Content>
      </MessagePrimitive.Root>
    );
    expect(html).toContain("<strong>Replace me</strong>");
    expect(html).toContain("<em>report.pdf</em>");
  });

  it("uses controlled conversation messages directly, without a runtime provider", () => {
    const messages: Message[] = [{
      id: "controlled-conversation", threadId: "thread", role: "assistant", status: "complete", createdAt: 1,
      parts: [{ type: "text", text: "Exact controlled value" }]
    }];
    const html = renderToStaticMarkup(
      <ConversationPrimitive.Root messages={messages}>
        <ConversationPrimitive.List>
          <ConversationPrimitive.Items>{(messageId) => <MessagePrimitive.Root messageId={messageId}><MessagePrimitive.Content /></MessagePrimitive.Root>}</ConversationPrimitive.Items>
        </ConversationPrimitive.List>
      </ConversationPrimitive.Root>
    );
    expect(html).toContain("Exact controlled value");
    expect(html).toContain('data-empty="false"');
  });

  it("lets a registry renderer intentionally suppress a part and otherwise falls back deterministically", () => {
    const message: Message = {
      id: "rendering", threadId: "thread", role: "assistant", status: "complete", createdAt: 1,
      parts: [{ type: "text", text: "Hidden" }, { type: "data", data: { visible: true } }]
    };
    const html = renderToStaticMarkup(
      <MessagePrimitive.RendererProvider registry={{ components: { text: () => null }, renderFallback: ({ part }) => <i>{part.type}</i> }}>
        <MessagePrimitive.Root message={message}><MessagePrimitive.Content /></MessagePrimitive.Root>
      </MessagePrimitive.RendererProvider>
    );
    expect(html).not.toContain("Hidden");
    expect(html).toContain("<i>data</i>");
  });

  it("renders retained content and interruption meaning without an error alert", () => {
    const runtime = createRuntime("thread-interrupted", [
      { schemaVersion: 1, id: "1", threadId: "thread-interrupted", timestamp: 1, type: "message.started", messageId: "m3", role: "assistant" },
      { schemaVersion: 1, id: "2", threadId: "thread-interrupted", timestamp: 2, type: "message.delta", messageId: "m3", delta: "Retained partial response" },
      { schemaVersion: 1, id: "3", threadId: "thread-interrupted", timestamp: 3, type: "message.interrupted", messageId: "m3", reason: "Stopped by the user" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <MessagePrimitive.Root messageId="m3">
          <MessagePrimitive.Content />
          <MessagePrimitive.Interruption />
          <MessagePrimitive.Error />
          <MessagePrimitive.Status />
        </MessagePrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('data-status="interrupted"');
    expect(html).toContain("Retained partial response");
    expect(html).toContain("Stopped by the user");
    expect(html).toContain("Response interrupted");
    expect(html).not.toContain('role="alert"');
  });

  it("renders an ordered, non-live conversation transcript from runtime state", () => {
    const runtime = createRuntime("thread-conversation", [
      { schemaVersion: 1, id: "1", threadId: "thread-conversation", timestamp: 1, type: "message.started", messageId: "m1", role: "user" },
      { schemaVersion: 1, id: "2", threadId: "thread-conversation", timestamp: 2, type: "message.delta", messageId: "m1", delta: "Plan this" },
      { schemaVersion: 1, id: "3", threadId: "thread-conversation", timestamp: 3, type: "message.completed", messageId: "m1" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ConversationPrimitive.Root>
          <ConversationPrimitive.Viewport>
            <ConversationPrimitive.List>
              <ConversationPrimitive.Items>{(messageId) => <MessagePrimitive.Root messageId={messageId}><MessagePrimitive.Content /></MessagePrimitive.Root>}</ConversationPrimitive.Items>
            </ConversationPrimitive.List>
          </ConversationPrimitive.Viewport>
          <ConversationPrimitive.Status />
        </ConversationPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="Conversation"');
    expect(html).toContain('data-empty="false"');
    expect(html).toContain('role="list"');
    expect(html).not.toContain('role="log"');
    expect(html).toContain("Plan this");
    expect(html).toContain("Conversation ready");
  });

  it("renders the conversation empty state without an empty list", () => {
    const runtime = createRuntime("thread-empty");
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ConversationPrimitive.Root>
          <ConversationPrimitive.Empty>No messages yet</ConversationPrimitive.Empty>
          <ConversationPrimitive.List><li>Never rendered</li></ConversationPrimitive.List>
        </ConversationPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('data-empty="true"');
    expect(html).toContain("No messages yet");
    expect(html).not.toContain("Never rendered");
  });

  it("announces an interrupted latest response once at conversation level", () => {
    const runtime = createRuntime("thread-interrupted", [
      { schemaVersion: 1, id: "1", threadId: "thread-interrupted", timestamp: 1, type: "message.started", messageId: "m1", role: "assistant" },
      { schemaVersion: 1, id: "2", threadId: "thread-interrupted", timestamp: 2, type: "message.delta", messageId: "m1", delta: "Partial response" },
      { schemaVersion: 1, id: "3", threadId: "thread-interrupted", timestamp: 3, type: "message.interrupted", messageId: "m1", reason: "Stopped by the user" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ConversationPrimitive.Root>
          <ConversationPrimitive.Status />
        </ConversationPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('data-aifk-conversation-status="interrupted"');
    expect(html).toContain("Response interrupted. Partial response preserved.");
    expect(html.match(/role="status"/g)).toHaveLength(1);
  });

  it("keeps streaming activity authoritative when a later user message is complete", () => {
    const runtime = createRuntime("thread-overlap", [
      { schemaVersion: 1, id: "1", threadId: "thread-overlap", timestamp: 1, type: "message.started", messageId: "assistant-1", role: "assistant" },
      { schemaVersion: 1, id: "2", threadId: "thread-overlap", timestamp: 2, type: "message.delta", messageId: "assistant-1", delta: "Still generating" },
      { schemaVersion: 1, id: "3", threadId: "thread-overlap", timestamp: 3, type: "message.started", messageId: "user-2", role: "user" },
      { schemaVersion: 1, id: "4", threadId: "thread-overlap", timestamp: 4, type: "message.delta", messageId: "user-2", delta: "One more detail" },
      { schemaVersion: 1, id: "5", threadId: "thread-overlap", timestamp: 5, type: "message.completed", messageId: "user-2" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ConversationPrimitive.Root><ConversationPrimitive.Status /></ConversationPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('data-aifk-conversation-status="streaming"');
    expect(html).toContain("Generating response");
  });

  it("server-renders an accessible composer", () => {
    const html = renderToStaticMarkup(<ComposerPrimitive.Root onSubmit={() => undefined}><ComposerPrimitive.Input /><ComposerPrimitive.Submit /></ComposerPrimitive.Root>);
    expect(html).toContain('aria-label="Message"');
    expect(html).toContain('type="submit"');
  });

  it("supports attachment-only composer submission through a host predicate", () => {
    const defaultComposer = renderToStaticMarkup(<ComposerPrimitive.Root onSubmit={() => undefined}><ComposerPrimitive.Submit /></ComposerPrimitive.Root>);
    const attachmentComposer = renderToStaticMarkup(<ComposerPrimitive.Root canSubmit={() => true} onSubmit={() => undefined}><ComposerPrimitive.Submit /></ComposerPrimitive.Root>);
    expect(defaultComposer).toContain('disabled=""');
    expect(attachmentComposer).not.toContain('disabled=""');
  });

  it("renders attachment progress with native determinate and indeterminate semantics", () => {
    const determinate: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf" },
      status: "uploading",
      progress: { current: 35, total: 100 }
    };
    const determinateHtml = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={determinate} onCancel={() => undefined}>
        <AttachmentPrimitive.Status />
        <AttachmentPrimitive.Progress />
        <AttachmentPrimitive.Cancel />
      </AttachmentPrimitive.Root>
    );
    const indeterminateHtml = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={{ ...determinate, progress: { current: 35 } }}>
        <AttachmentPrimitive.Progress />
      </AttachmentPrimitive.Root>
    );
    expect(determinateHtml).toContain('aria-label="Attachment: brief.pdf"');
    expect(determinateHtml).toContain('aria-busy="true"');
    expect(determinateHtml).toContain('value="35"');
    expect(determinateHtml).toContain('max="100"');
    expect(determinateHtml).toContain('aria-label="Cancel upload brief.pdf"');
    expect(indeterminateHtml).toContain("<progress");
    expect(indeterminateHtml).not.toContain("value=");
    expect(indeterminateHtml).not.toContain("max=");
  });

  it("derives a paused attachment meaning while preserving controlled upload state", () => {
    const attachment: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf" },
      status: "uploading",
      progress: { current: 35, total: 100 }
    };
    const html = renderToStaticMarkup(
      <AttachmentPrimitive.Root
        attachment={attachment}
        connection={{ status: "offline", attempt: 1, updatedAt: 1 }}
        onCancel={() => undefined}
        onRetry={() => undefined}
      >
        <AttachmentPrimitive.Status />
        <AttachmentPrimitive.Retry />
        <AttachmentPrimitive.Cancel />
      </AttachmentPrimitive.Root>
    );
    expect(html).toContain('data-status="uploading"');
    expect(html).toContain('data-effective-status="paused"');
    expect(html).toContain("Upload paused");
    expect(html).not.toContain('aria-busy="true"');
    expect(html).toMatch(/aria-label="Retry upload brief.pdf"[^>]*disabled=""/);
    expect(html).toMatch(/aria-label="Cancel upload brief.pdf"/);
  });

  it("gates attachment recovery actions by normalized capability", () => {
    const failed: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf" },
      status: "failed",
      error: { message: "Upload interrupted.", recovery: "retry" }
    };
    const html = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={failed} onRetry={() => undefined} onReplace={() => undefined} onRemove={() => undefined}>
        <AttachmentPrimitive.Error />
        <AttachmentPrimitive.Retry />
        <AttachmentPrimitive.Replace />
        <AttachmentPrimitive.Remove />
      </AttachmentPrimitive.Root>
    );
    expect(html).toContain('data-recovery="retry"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Upload interrupted.");
    expect(html).toMatch(/aria-label="Retry upload brief.pdf"(?![^>]*disabled)/);
    expect(html).toMatch(/aria-label="Choose another file for brief.pdf"[^>]*disabled=""/);
    expect(html).toMatch(/aria-label="Remove brief.pdf"(?![^>]*disabled)/);
  });

  it("keeps local draft removal available only in safe transfer states", () => {
    const base: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf" },
      status: "queued"
    };
    const queued = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={base} onRemove={() => undefined}>
        <AttachmentPrimitive.Remove />
      </AttachmentPrimitive.Root>
    );
    const uploading = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={{ ...base, status: "uploading" }} onRemove={() => undefined}>
        <AttachmentPrimitive.Remove />
      </AttachmentPrimitive.Root>
    );
    expect(queued).toMatch(/aria-label="Remove brief.pdf"(?![^>]*disabled)/);
    expect(uploading).toMatch(/aria-label="Remove brief.pdf"[^>]*disabled=""/);
  });

  it("blocks provider recovery while offline and marks reconnecting roots busy", () => {
    const failed: AttachmentUpload = {
      id: "attachment-1",
      file: { type: "file", name: "brief.pdf" },
      status: "failed",
      error: { message: "Choose another file.", recovery: "replace" }
    };
    const offline = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={failed} connection={{ status: "offline", attempt: 1, updatedAt: 1 }} onReplace={() => undefined}>
        <AttachmentPrimitive.Replace />
      </AttachmentPrimitive.Root>
    );
    const reconnecting = renderToStaticMarkup(
      <AttachmentPrimitive.Root attachment={{ ...failed, status: "uploading" }} connection={{ status: "reconnecting", attempt: 2, updatedAt: 2 }}>
        <AttachmentPrimitive.Status />
      </AttachmentPrimitive.Root>
    );
    expect(offline).toMatch(/aria-label="Choose another file for brief.pdf"[^>]*disabled=""/);
    expect(reconnecting).toContain('aria-busy="true"');
    expect(reconnecting).toContain('data-effective-status="paused"');
  });

  it("labels tool regions and renders actionable failures", () => {
    const runtime = createRuntime("thread-tool", [
      { schemaVersion: 1, id: "1", threadId: "thread-tool", timestamp: 1, type: "tool.updated", toolCallId: "tool-1", name: "search", status: "failed", error: "Search index unavailable" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ToolPrimitive.Root toolCallId="tool-1">
          <ToolPrimitive.Name />
          <ToolPrimitive.Error />
        </ToolPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="Tool: search"');
    expect(html).toContain('role="alert"');
    expect(html).toContain("Search index unavailable");
  });

  it("renders long-running task progress and ordered steps from runtime state", () => {
    const runtime = createRuntime("thread-task", [
      { schemaVersion: 3, id: "1", threadId: "thread-task", timestamp: 1, type: "task.started", taskId: "task-1", title: "Research competitors" },
      { schemaVersion: 3, id: "2", threadId: "thread-task", timestamp: 2, type: "task.updated", taskId: "task-1", status: "running", progress: { current: 1, total: 3, label: "One of three steps" } },
      { schemaVersion: 3, id: "3", threadId: "thread-task", timestamp: 3, type: "task.step.updated", taskId: "task-1", step: { id: "sources", taskId: "task-1", title: "Collect sources", status: "running" } }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <TaskPrimitive.Root taskId="task-1">
          <TaskPrimitive.Title />
          <TaskPrimitive.Status />
          <TaskPrimitive.Progress />
          <TaskPrimitive.Steps>{(stepId) => <TaskPrimitive.Step stepId={stepId}><TaskPrimitive.StepTitle /><TaskPrimitive.StepStatus /></TaskPrimitive.Step>}</TaskPrimitive.Steps>
        </TaskPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="Task: Research competitors"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('aria-label="One of three steps"');
    expect(html).toContain("Collect sources");
  });

  it("renders unknown task progress as indeterminate", () => {
    const runtime = createRuntime("thread-indeterminate", [
      { schemaVersion: 3, id: "1", threadId: "thread-indeterminate", timestamp: 1, type: "task.started", taskId: "task-1", title: "Wait for provider" },
      { schemaVersion: 3, id: "2", threadId: "thread-indeterminate", timestamp: 2, type: "task.updated", taskId: "task-1", status: "running", progress: { current: 2 } }
    ]);
    const html = renderToStaticMarkup(<AIFrontKitProvider runtime={runtime}><TaskPrimitive.Root taskId="task-1"><TaskPrimitive.Progress /></TaskPrimitive.Root></AIFrontKitProvider>);
    expect(html).toContain("<progress");
    expect(html).not.toContain("value=");
    expect(html).not.toContain("max=");
  });

  it("binds approval actions to normalized runtime state", () => {
    const runtime = createRuntime("thread-approval", [
      { schemaVersion: 2, id: "1", threadId: "thread-approval", timestamp: 1, type: "approval.requested", approvalId: "approval-1", toolCallId: "tool-1", summary: "Deploy to production" }
    ]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ApprovalPrimitive.Root approvalId="approval-1">
          <ApprovalPrimitive.Summary />
          <ApprovalPrimitive.Reject />
          <ApprovalPrimitive.Approve />
          <ApprovalPrimitive.Status />
        </ApprovalPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="Approval required"');
    expect(html).toContain("Deploy to production");
    expect(html).not.toContain("disabled");
  });

  it("does not allow resolved approval buttons to be re-enabled by props", () => {
    const html = renderToStaticMarkup(
      <ApprovalPrimitive.Root approval={{ id: "approval-1", toolCallId: "tool-1", summary: "Deploy", status: "approved" }}>
        <ApprovalPrimitive.Approve disabled={false} />
        <ApprovalPrimitive.Reject disabled={false} />
      </ApprovalPrimitive.Root>
    );
    expect(html.match(/disabled=""/g)).toHaveLength(2);
  });

  it("renders reconnecting state as a polite busy status", () => {
    const runtime = createRuntime("thread-connection", [{
      schemaVersion: 3, id: "connection-1", threadId: "thread-connection", timestamp: 1,
      type: "connection.changed", status: "reconnecting", attempt: 2, nextRetryAt: 10
    }]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ConnectionPrimitive.Root>
          <ConnectionPrimitive.Status />
          <ConnectionPrimitive.Message />
          <ConnectionPrimitive.Retry />
        </ConnectionPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain('aria-label="Connection status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-status="reconnecting"');
    expect(html).toContain('data-attempt="2"');
    expect(html).toContain('aria-live="polite"');
    expect(html).not.toContain("Retry connection");
  });

  it("renders an offline state and disables retry without a handler", () => {
    const html = renderToStaticMarkup(
      <ConnectionPrimitive.Root connection={{ status: "offline", attempt: 1, updatedAt: 1, reason: "Browser offline" }}>
        <ConnectionPrimitive.Status />
        <ConnectionPrimitive.Message />
        <ConnectionPrimitive.Retry />
      </ConnectionPrimitive.Root>
    );
    expect(html).toContain("You are offline");
    expect(html).toContain("Browser offline");
    expect(html).toContain('type="button"');
    expect(html).toContain("Retry connection");
    expect(html).toContain('disabled=""');
  });

  it("enables controlled connection retry when an action is supplied", () => {
    const html = renderToStaticMarkup(
      <ConnectionPrimitive.Root connection={{ status: "failed", attempt: 2, updatedAt: 2, error: "Retries exhausted" }} onRetry={() => undefined}>
        <ConnectionPrimitive.Retry />
      </ConnectionPrimitive.Root>
    );
    expect(html).toContain("Retry connection");
    expect(html).not.toContain("disabled");
  });

  it("renders a controlled artifact review with stable semantic hooks", () => {
    const artifact: Artifact = {
      id: "artifact-1",
      title: "Market report",
      kind: "document",
      version: 3,
      status: "ready",
      content: { sections: 4 },
      updatedAt: 20,
      review: { version: 3, status: "requested", updatedAt: 20 }
    };
    const html = renderToStaticMarkup(
      <ArtifactPrimitive.Root artifact={artifact} onAccept={() => undefined} onRequestChanges={() => undefined}>
        <ArtifactPrimitive.Title />
        <ArtifactPrimitive.Kind />
        <ArtifactPrimitive.Version />
        <ArtifactPrimitive.Status />
        <ArtifactPrimitive.ReviewStatus />
        <ArtifactPrimitive.Content>{(content) => <pre>{JSON.stringify(content)}</pre>}</ArtifactPrimitive.Content>
        <ArtifactPrimitive.Accept />
        <ArtifactPrimitive.RequestChanges />
      </ArtifactPrimitive.Root>
    );
    expect(html).toContain('aria-label="Artifact: Market report"');
    expect(html).toContain('data-aifk-artifact=""');
    expect(html).toContain('data-version="3"');
    expect(html).toContain('data-review-status="requested"');
    expect(html).toContain('data-aifk-artifact-content=""');
    expect(html).toContain('{&quot;sections&quot;:4}');
    expect(html).toContain("Request changes");
    expect(html).not.toContain("disabled");
  });

  it("resolves an artifact from runtime state without a controlled artifact", () => {
    const runtime = createRuntime("thread-artifact", [{
      schemaVersion: 3,
      id: "artifact-event",
      threadId: "thread-artifact",
      timestamp: 12,
      type: "artifact.updated",
      artifact: { id: "artifact-1", title: "Runtime report", kind: "document", version: 1, status: "ready", content: "Final copy" }
    }]);
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime}>
        <ArtifactPrimitive.Root artifactId="artifact-1">
          <ArtifactPrimitive.Title />
          <ArtifactPrimitive.Content />
        </ArtifactPrimitive.Root>
      </AIFrontKitProvider>
    );
    expect(html).toContain("Runtime report");
    expect(html).toContain("Final copy");
  });

  it("disables review actions unless a requested review matches the ready artifact version", () => {
    const baseArtifact: Artifact = {
      id: "artifact-1",
      title: "Report",
      kind: "document",
      version: 2,
      status: "ready",
      review: { version: 1, status: "requested", updatedAt: 1 }
    };
    const stale = renderToStaticMarkup(
      <ArtifactPrimitive.Root artifact={baseArtifact} onAccept={() => undefined} onReject={() => undefined}>
        <ArtifactPrimitive.Accept />
        <ArtifactPrimitive.Reject />
      </ArtifactPrimitive.Root>
    );
    const resolved = renderToStaticMarkup(
      <ArtifactPrimitive.Root artifact={{ ...baseArtifact, review: { version: 2, status: "accepted", updatedAt: 2 } }} onAccept={() => undefined} onRequestChanges={() => undefined}>
        <ArtifactPrimitive.Accept />
        <ArtifactPrimitive.RequestChanges />
      </ArtifactPrimitive.Root>
    );
    const missingCallbacks = renderToStaticMarkup(
      <ArtifactPrimitive.Root artifact={{ ...baseArtifact, review: { version: 2, status: "requested", updatedAt: 2 } }}>
        <ArtifactPrimitive.Accept />
        <ArtifactPrimitive.RequestChanges />
      </ArtifactPrimitive.Root>
    );
    expect(stale.match(/disabled=""/g)).toHaveLength(2);
    expect(stale).toContain('data-review-status="stale"');
    expect(stale).toContain('data-review-stale="true"');
    expect(resolved.match(/disabled=""/g)).toHaveLength(2);
    expect(missingCallbacks.match(/disabled=""/g)).toHaveLength(2);
  });

  it("renders artifact failures as alerts without review actions becoming active", () => {
    const html = renderToStaticMarkup(
      <ArtifactPrimitive.Root artifact={{
        id: "artifact-1",
        title: "Report",
        kind: "document",
        version: 1,
        status: "failed",
        error: "The export could not be generated.",
        review: { version: 1, status: "requested", updatedAt: 2 }
      }} onAccept={() => undefined}>
        <ArtifactPrimitive.Error />
        <ArtifactPrimitive.Accept />
      </ArtifactPrimitive.Root>
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("The export could not be generated.");
    expect(html).toContain('disabled=""');
  });

  it("projects a configurable theme onto a scoped root", () => {
    const html = renderToStaticMarkup(
      <ThemeProvider theme={{ mode: "dark", density: "compact", radius: "large", motion: { level: "none" } }}>
        <p>Scoped content</p>
      </ThemeProvider>
    );
    expect(html).toContain('data-aifk-theme="dark"');
    expect(html).toContain('data-aifk-density="compact"');
    expect(html).toContain('data-aifk-radius="large"');
    expect(html).toContain('data-aifk-motion="none"');
    expect(html).toContain("--aifk-canvas:#0d0d0f");
    expect(html).toContain("Scoped content");
  });

  it("lets the runtime provider apply a theme without a platform dependency", () => {
    const runtime = createRuntime("thread-themed");
    const html = renderToStaticMarkup(
      <AIFrontKitProvider runtime={runtime} theme={{ temperature: "warm", accent: "teal" }}>
        <span>Themed runtime</span>
      </AIFrontKitProvider>
    );
    expect(html).toContain('data-aifk-temperature="warm"');
    expect(html).toContain("--aifk-accent:#0f766e");
  });
});
