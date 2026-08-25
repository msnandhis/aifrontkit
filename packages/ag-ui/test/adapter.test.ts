import { describe, expect, it } from "vitest";
import { createAGUIAdapter } from "../src/index.js";

describe("AG-UI adapter", () => {
  it("normalizes the text start/content/end lifecycle", () => {
    const adapter = createAGUIAdapter({ threadId: "t1", now: () => 1 });
    const events = [
      ...adapter.adapt({ type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" }),
      ...adapter.adapt({ type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Hello" }),
      ...adapter.adapt({ type: "TEXT_MESSAGE_END", messageId: "m1" })
    ];
    expect(events.map((event) => event.type)).toEqual(["message.started", "message.delta", "message.completed"]);
  });

  it("assembles streamed tool arguments", () => {
    const adapter = createAGUIAdapter({ threadId: "t1" });
    adapter.adapt({ type: "TOOL_CALL_START", toolCallId: "c1", toolCallName: "search" });
    adapter.adapt({ type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "{\"q\":" });
    const [event] = adapter.adapt({ type: "TOOL_CALL_ARGS", toolCallId: "c1", delta: "\"docs\"}" });
    expect(event?.type === "tool.updated" && event.input).toEqual({ q: "docs" });
  });
});
