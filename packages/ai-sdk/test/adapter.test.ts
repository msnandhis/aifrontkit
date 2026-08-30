import { describe, expect, it } from "vitest";
import { createAISDKAdapter } from "../src/index.js";

describe("AI SDK UI stream adapter", () => {
  it("normalizes official UI message chunks to part-addressed v3 events", () => {
    let id = 0;
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1", now: () => 10, createId: () => String(++id) });
    const events = [
      ...adapter.adapt({ type: "start", messageId: "m1" }),
      ...adapter.adapt({ type: "text-start", id: "text-1" }),
      ...adapter.adapt({ type: "text-delta", id: "text-1", delta: "Hi" }),
      ...adapter.adapt({ type: "text-end", id: "text-1" }),
      ...adapter.adapt({ type: "finish" })
    ];
    expect(events.map((event) => event.type)).toEqual(["message.started", "message.part.added", "message.part.delta", "message.part.status", "message.completed"]);
    expect(events.every((event) => event.schemaVersion === 3)).toBe(true);
  });

  it("preserves tool identity across input and output parts", () => {
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1" });
    adapter.adapt({ type: "tool-input-available", toolCallId: "call-1", toolName: "weather", input: { city: "Pune" } });
    const [event] = adapter.adapt({ type: "tool-output-available", toolCallId: "call-1", output: { value: 28 } });
    expect(event?.type === "tool.updated" && event.name).toBe("weather");
  });

  it("uses the stream-provided message ID for subsequent parts", () => {
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "fallback" });
    adapter.adapt({ type: "start", messageId: "stream-message" });
    const [event] = adapter.adapt({ type: "text-delta", id: "text-1", delta: "Hi" });
    expect(event?.type === "message.part.delta" && event.messageId).toBe("stream-message");
  });

  it("preserves reasoning, sources, files and typed data as ordered message parts", () => {
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1" });
    const events = [
      ...adapter.adapt({ type: "reasoning-start", id: "reasoning-1" }),
      ...adapter.adapt({ type: "reasoning-delta", id: "reasoning-1", delta: "Checking" }),
      ...adapter.adapt({ type: "source-url", sourceId: "source-1", url: "https://example.com", title: "Example" }),
      ...adapter.adapt({ type: "file", id: "file-1", url: "https://example.com/report.pdf", mediaType: "application/pdf", filename: "report.pdf" }),
      ...adapter.adapt({ type: "data-progress", id: "data-1", data: { current: 2 } })
    ];
    expect(events.map((event) => event.type)).toEqual(["message.part.added", "message.part.delta", "message.part.added", "message.part.added", "message.part.added"]);
  });

  it("maps approval requests to linked tool and approval state", () => {
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1" });
    adapter.adapt({ type: "tool-input-available", toolCallId: "call-1", toolName: "deploy", input: { target: "prod" } });
    const events = adapter.adapt({ type: "tool-approval-request", approvalId: "approval-1", toolCallId: "call-1" });
    expect(events.map((event) => event.type)).toEqual(["tool.updated", "approval.requested"]);
  });

  it("does not overwrite an inline stream failure with a later finish chunk", () => {
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1" });
    expect(adapter.adapt({ type: "error", errorText: "Upstream failed" })[0]).toMatchObject({ type: "message.failed" });
    expect(adapter.adapt({ type: "finish" })).toEqual([]);
  });
});
