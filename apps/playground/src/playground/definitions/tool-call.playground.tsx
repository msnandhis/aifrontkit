import { createRuntime, type AIFrontEvent, type ToolStatus } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { ToolCall } from "../../../../../registry/react/css/components/tool-call/tool-call.js";
import { definePlayground, environmentControlsFor, environmentDefaults, type PlaygroundRecord, type PlaygroundState } from "../types.js";
import { q } from "./shared.js";

interface ToolCallProps extends PlaygroundRecord {
  name: string;
  status: ToolStatus;
  input: string;
  output: string;
  error: string;
  showInput: boolean;
  showActions: boolean;
  customIcon: boolean;
}

type ToolCallState = PlaygroundState<ToolCallProps>;

const defaults: ToolCallState = {
  props: {
    name: "search_documentation",
    status: "complete",
    input: "component playground",
    output: "Found 4 matching documentation pages.",
    error: "The documentation index is unavailable. Retry the search.",
    showInput: false,
    showActions: true,
    customIcon: false,
  },
  environment: { ...environmentDefaults },
};

function eventFor(props: ToolCallProps): AIFrontEvent {
  return {
    schemaVersion: 1,
    id: "tool-event-1",
    threadId: "playground-thread",
    timestamp: 1,
    type: "tool.updated",
    toolCallId: "tool-1",
    name: props.name,
    status: props.status,
    input: { query: props.input },
    ...(props.status === "complete" ? { output: { summary: props.output } } : {}),
    ...(props.status === "failed" ? { error: props.error } : {}),
  };
}

function preview(state: ToolCallState, emit: (message: string) => void) {
  const props = state.props;
  const runtime = createRuntime("playground-thread", [eventFor(props)]);
  return (
    <AIFrontKitProvider runtime={runtime}>
      <ToolCall
        toolCallId="tool-1"
        icon={props.customIcon ? <span className="playground-avatar">AF</span> : undefined}
        actions={props.showActions ? <button type="button" onClick={() => emit('onToolAction("tool-1")')}>Options</button> : undefined}
      >
        {props.showInput ? <div className="playground-tool-input"><span>Input</span><code>{props.input}</code></div> : null}
        {props.status === "complete" ? <pre>{JSON.stringify({ summary: props.output }, null, 2)}</pre> : null}
        {props.status === "failed" ? <p role="alert">{props.error}</p> : null}
      </ToolCall>
    </AIFrontKitProvider>
  );
}

function codeFor(state: ToolCallState) {
  const props = state.props;
  const environment = state.environment;
  const eventLines = [
    "  schemaVersion: 1,",
    '  id: "tool-event-1",',
    '  threadId: "playground-thread",',
    "  timestamp: 1,",
    '  type: "tool.updated",',
    '  toolCallId: "tool-1",',
    "  name: " + q(props.name) + ",",
    "  status: " + q(props.status) + ",",
    "  input: { query: " + q(props.input) + " },",
    props.status === "complete" ? "  output: { summary: " + q(props.output) + " }," : "",
    props.status === "failed" ? "  error: " + q(props.error) + "," : "",
  ].filter(Boolean);
  return [
    '"use client";',
    "",
    "// AIFrontKit example · " + environment.framework + " · " + environment.style + " · " + environment.language,
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
    "  <div dir=" + q(environment.direction) + " data-theme=" + q(environment.theme) + ">",
    "  <AIFrontKitProvider runtime={runtime}>",
    '    <ToolCall toolCallId="tool-1"' + (props.customIcon ? ' icon={<span aria-hidden="true">AF</span>}' : "") + (props.showActions ? ' actions={<button type="button">Options</button>}' : "") + ">",
    props.showInput ? "      <div><span>Input</span><code>{" + q(props.input) + "}</code></div>" : "",
    props.status === "complete" ? "      <pre>{JSON.stringify({ summary: " + q(props.output) + " }, null, 2)}</pre>" : "",
    props.status === "failed" ? "      <p role=\"alert\">{" + q(props.error) + "}</p>" : "",
    "    </ToolCall>",
    "  </AIFrontKitProvider>",
    "  </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

const scenarioVersion = "1.0.0";

export const toolCallPlayground = definePlayground({
  id: "tool-call",
  version: scenarioVersion,
  label: "Tool Call",
  description: "Inspect tool identity, lifecycle, input, output, error, actions, and runtime integration.",
  defaults,
  scenarios: [
    { id: "default", version: scenarioVersion, label: "Complete", description: "Structured output is available.", values: {}, testId: "tool-call-default" },
    { id: "pending", version: scenarioVersion, label: "Pending", description: "Queued work has not started.", values: { props: { status: "pending" } }, testId: "tool-call-pending" },
    { id: "running", version: scenarioVersion, label: "Running", description: "Active work exposes a busy state.", values: { props: { status: "running" } }, testId: "tool-call-running" },
    { id: "failed", version: scenarioVersion, label: "Failed", description: "Failure meaning remains attached to the tool.", values: { props: { status: "failed" } }, testId: "tool-call-failed" },
    { id: "cancelled", version: scenarioVersion, label: "Cancelled", description: "Stopped work remains understandable without an alarm.", values: { props: { status: "cancelled" } }, testId: "tool-call-cancelled" },
    { id: "with-input", version: scenarioVersion, label: "With input", description: "Application-owned input is composed through children.", values: { props: { showInput: true } }, testId: "tool-call-with-input" },
  ],
  controls: [
    { scope: "props", key: "name", label: "Tool name", type: "text", group: "Content" },
    { scope: "props", key: "input", label: "Input value", type: "textarea", group: "Content" },
    { scope: "props", key: "output", label: "Output summary", type: "textarea", group: "Content", visible: (state) => state.props.status === "complete" },
    { scope: "props", key: "error", label: "Error message", type: "textarea", group: "Content", visible: (state) => state.props.status === "failed" },
    { scope: "props", key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: [{ label: "Pending", value: "pending" }, { label: "Running", value: "running" }, { label: "Complete", value: "complete" }, { label: "Failed", value: "failed" }, { label: "Cancelled", value: "cancelled" }] },
    { scope: "props", key: "showInput", label: "Input content", type: "boolean", group: "Slots" },
    { scope: "props", key: "showActions", label: "Actions", type: "boolean", group: "Slots" },
    { scope: "props", key: "customIcon", label: "Custom icon", type: "boolean", group: "Slots" },
    ...environmentControlsFor(defaults),
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
