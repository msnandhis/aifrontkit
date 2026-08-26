import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { createRuntime } from "@aifrontkit/core";
import { AIFrontKitProvider, ComposerPrimitive, ConversationPrimitive, MessagePrimitive, ThemeProvider } from "../src/index.js";

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

  it("server-renders an accessible composer", () => {
    const html = renderToStaticMarkup(<ComposerPrimitive.Root onSubmit={() => undefined}><ComposerPrimitive.Input /><ComposerPrimitive.Submit /></ComposerPrimitive.Root>);
    expect(html).toContain('aria-label="Message"');
    expect(html).toContain('type="submit"');
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
