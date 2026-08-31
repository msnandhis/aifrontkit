import {
  createUIMessageStream,
  type UIMessageChunk
} from "ai";

const reviewedChunks = [
  { type: "start", messageId: "compatibility-message" },
  { type: "text-start", id: "compatibility-text" },
  { type: "text-delta", id: "compatibility-text", delta: "Ready" },
  { type: "tool-input-start", toolCallId: "compatibility-tool", toolName: "search" },
  {
    type: "tool-input-available",
    toolCallId: "compatibility-tool",
    toolName: "search",
    input: { query: "compatibility" }
  },
  { type: "tool-approval-request", approvalId: "compatibility-approval", toolCallId: "compatibility-tool" },
  { type: "tool-output-available", toolCallId: "compatibility-tool", output: { matches: 1 } },
  { type: "text-end", id: "compatibility-text" },
  { type: "finish" }
] satisfies UIMessageChunk[];

const stream = createUIMessageStream({
  execute({ writer }) {
    for (const chunk of reviewedChunks) writer.write(chunk);
  }
});

const receivedTypes: string[] = [];
for await (const chunk of stream) receivedTypes.push(chunk.type);

const expectedTypes = reviewedChunks.map((chunk) => chunk.type);
if (receivedTypes.join("|") !== expectedTypes.join("|")) {
  throw new Error(`AI SDK UI stream changed shape: ${receivedTypes.join(",")}`);
}
