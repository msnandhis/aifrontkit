import { createRuntime, type AIFrontEvent, type ToolStatus } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { ToolCall } from "../../../../../registry/react/css/components/tool-call/tool-call.js";
import { definePlayground, type PlaygroundState } from "../types.js";
import { q } from "./shared.js";

interface ToolCallState extends PlaygroundState {
  name: string;
  status: ToolStatus;
  input: string;
  output: string;
  error: string;
  showInput: boolean;
  showActions: boolean;
  customIcon: boolean;
}

const defaults: ToolCallState = {
  name: "search_documentation",
  status: "complete",
  input: "component playground",
  output: "Found 4 matching documentation pages.",
  error: "The documentation index is unavailable. Retry the search.",
  showInput: false,
  showActions: true,
  customIcon: false,
};

function eventFor(state: ToolCallState): AIFrontEvent {
  return {
    schemaVersion: 1,
    id: "tool-event-1",
    threadId: "playground-thread",
    timestamp: 1,
    type: "tool.updated",
    toolCallId: "tool-1",
    name: state.name,
    status: state.status,
    input: { query: state.input },
    ...(state.status === "complete" ? { output: { summary: state.output } } : {}),
    ...(state.status === "failed" ? { error: state.error } : {}),
  };
}

function preview(state: ToolCallState, emit: (message: string) => void) {
  const runtime = createRuntime("playground-thread", [eventFor(state)]);
  return (
    <AIFrontKitProvider runtime={runtime}>
      <ToolCall
        toolCallId="tool-1"
        icon={state.customIcon ? <span className="playground-avatar">AF</span> : undefined}
        actions={state.showActions ? <button type="button" onClick={() => emit('onToolAction("tool-1")')}>Options</button> : undefined}
      >
        {state.showInput ? <div className="playground-tool-input"><span>Input</span><code>{state.input}</code></div> : null}
        {state.status === "complete" ? <pre>{JSON.stringify({ summary: state.output }, null, 2)}</pre> : null}
        {state.status === "failed" ? <p role="alert">{state.error}</p> : null}
      </ToolCall>
    </AIFrontKitProvider>
  );
}

function codeFor(state: ToolCallState) {
  const eventLines = [
    "  schemaVersion: 1,",
    '  id: "tool-event-1",',
    '  threadId: "playground-thread",',
    "  timestamp: 1,",
    '  type: "tool.updated",',
    '  toolCallId: "tool-1",',
    "  name: " + q(state.name) + ",",
    "  status: " + q(state.status) + ",",
    "  input: { query: " + q(state.input) + " },",
    state.status === "complete" ? "  output: { summary: " + q(state.output) + " }," : "",
    state.status === "failed" ? "  error: " + q(state.error) + "," : "",
  ].filter(Boolean);
  return [
    '\"use client\";',
    "",
    'import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";',
    'import { AIFrontKitProvider } from "@aifrontkit/react";',
    'import { ToolCall } from "@/components/aifrontkit/tool-call";',
    "",
    "const event: AIFrontEvent = {",
    ...eventLines,
    "};",
    "",
    'const runtime = createRuntime("playground-thread", [event]);',
    "",
    "export function ToolCallExample() {",
    "  return (",
    "  <AIFrontKitProvider runtime={runtime}>",
    '    <ToolCall toolCallId="tool-1"' + (state.customIcon ? ' icon={<span aria-hidden="true">AF</span>}' : "") + (state.showActions ? ' actions={<button type="button">Options</button>}' : "") + ">",
    state.showInput ? '      <div><span>Input</span><code>{' + q(state.input) + "}</code></div>" : "",
    state.status === "complete" ? "      <pre>{JSON.stringify({ summary: " + q(state.output) + " }, null, 2)}</pre>" : "",
    state.status === "failed" ? "      <p role=\"alert\">{" + q(state.error) + "}</p>" : "",
    "    </ToolCall>",
    "  </AIFrontKitProvider>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

export const toolCallPlayground = definePlayground({
  id: "tool-call",
  label: "Tool Call",
  description: "Inspect tool identity, lifecycle, input, output, error, actions, and runtime integration.",
  defaults,
  presets: [
    { id: "default", label: "Complete", description: "Structured output is available.", values: {} },
    { id: "pending", label: "Pending", description: "Queued work has not started.", values: { status: "pending" } },
    { id: "running", label: "Running", description: "Active work exposes a busy state.", values: { status: "running" } },
    { id: "failed", label: "Failed", description: "Failure meaning remains attached to the tool.", values: { status: "failed" } },
    { id: "cancelled", label: "Cancelled", description: "Stopped work remains understandable without an alarm.", values: { status: "cancelled" } },
    { id: "with-input", label: "With input", description: "Application-owned input is composed through children.", values: { showInput: true } },
  ],
  controls: [
    { key: "name", label: "Tool name", type: "text", group: "Content" },
    { key: "input", label: "Input value", type: "textarea", group: "Content" },
    { key: "output", label: "Output summary", type: "textarea", group: "Content", visible: (state) => state.status === "complete" },
    { key: "error", label: "Error message", type: "textarea", group: "Content", visible: (state) => state.status === "failed" },
    { key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: [{ label: "Pending", value: "pending" }, { label: "Running", value: "running" }, { label: "Complete", value: "complete" }, { label: "Failed", value: "failed" }, { label: "Cancelled", value: "cancelled" }] },
    { key: "showInput", label: "Input content", type: "boolean", group: "Slots" },
    { key: "showActions", label: "Actions", type: "boolean", group: "Slots" },
    { key: "customIcon", label: "Custom icon", type: "boolean", group: "Slots" },
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
