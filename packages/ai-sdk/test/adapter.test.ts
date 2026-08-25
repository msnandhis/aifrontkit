import { describe, expect, it } from "vitest";
import { createAISDKAdapter } from "../src/index.js";

describe("AI SDK UI stream adapter", () => {
  it("normalizes official v1 start/delta/finish parts", () => {
    let id = 0;
    const adapter = createAISDKAdapter({ threadId: "t1", messageId: "m1", now: () => 10, createId: () => String(++id) });
    const events = [
      ...adapter.adapt({ type: "start", messageId: "m1" }),
      ...adapter.adapt({ type: "text-delta", id: "text-1", delta: "Hi" }),
      ...adapter.adapt({ type: "finish" })
    ];
    expect(events.map((event) => event.type)).toEqual(["message.started", "message.delta", "message.completed"]);
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
    expect(event?.type === "message.delta" && event.messageId).toBe("stream-message");
  });
});
