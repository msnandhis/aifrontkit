import {
  EventType,
  RunStartedEventSchema,
  StateSnapshotEventSchema,
  TextMessageContentEventSchema,
  ToolCallStartEventSchema,
  type RunStartedEvent,
  type StateSnapshotEvent,
  type TextMessageContentEvent,
  type ToolCallStartEvent
} from "@ag-ui/core";

const reviewedEvents = [
  {
    schema: RunStartedEventSchema,
    event: { type: EventType.RUN_STARTED, threadId: "compatibility-thread", runId: "compatibility-run" } satisfies RunStartedEvent
  },
  {
    schema: TextMessageContentEventSchema,
    event: { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "compatibility-message", delta: "Ready" } satisfies TextMessageContentEvent
  },
  {
    schema: ToolCallStartEventSchema,
    event: {
      type: EventType.TOOL_CALL_START,
      toolCallId: "compatibility-tool",
      toolCallName: "search",
      parentMessageId: "compatibility-message"
    } satisfies ToolCallStartEvent
  },
  {
    schema: StateSnapshotEventSchema,
    event: { type: EventType.STATE_SNAPSHOT, snapshot: { status: "working" } } satisfies StateSnapshotEvent
  }
];

for (const { schema, event } of reviewedEvents) {
  const parsed = schema.parse(event);
  if (parsed.type !== event.type) throw new Error(`AG-UI event changed shape: ${event.type}`);
}
