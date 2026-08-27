import { createContext, useContext, type ComponentPropsWithoutRef, type PropsWithChildren } from "react";
import type { ToolCall } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

const ToolContext = createContext<ToolCall | null>(null);

export interface ToolRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  /** Controlled tool data; does not require a runtime provider. */
  tool?: ToolCall;
  /** Runtime lookup identifier for event-driven tool state. */
  toolCallId?: string;
}

type ToolFrameProps = Omit<ToolRootProps, "tool" | "toolCallId"> & { tool: ToolCall };

function RootFrame({ tool, children, ...props }: ToolFrameProps) {
  if (!tool) return null;
  return <ToolContext.Provider value={tool}><section aria-label={`Tool: ${tool.name}`} data-aifk-tool="" data-status={tool.status} aria-busy={tool.status === "running"} {...props}>{children}</section></ToolContext.Provider>;
}

function RuntimeRoot({ toolCallId, ...props }: Omit<ToolRootProps, "tool"> & { toolCallId: string }) {
  const tool = useRuntimeState((state) => state.tools[toolCallId]);
  return tool ? <RootFrame {...props} tool={tool} /> : null;
}

function Root({ tool, toolCallId, ...props }: ToolRootProps) {
  if (tool) return <RootFrame {...props} tool={tool} />;
  if (toolCallId) return <RuntimeRoot {...props} toolCallId={toolCallId} />;
  throw new Error("ToolPrimitive.Root requires either `tool` or `toolCallId`.");
}

function Name() {
  const tool = useContext(ToolContext);
  if (!tool) throw new Error("ToolPrimitive.Name must be inside ToolPrimitive.Root.");
  return <span>{tool.name}</span>;
}

function Status() {
  const tool = useContext(ToolContext);
  if (!tool) throw new Error("ToolPrimitive.Status must be inside ToolPrimitive.Root.");
  return <span role="status">{tool.status}</span>;
}

function Output() {
  const tool = useContext(ToolContext);
  if (!tool) throw new Error("ToolPrimitive.Output must be inside ToolPrimitive.Root.");
  return tool.output === undefined ? null : <pre>{JSON.stringify(tool.output, null, 2)}</pre>;
}

function ToolError({ children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"p">>) {
  const tool = useContext(ToolContext);
  if (!tool) throw new Error("ToolPrimitive.Error must be inside ToolPrimitive.Root.");
  if (tool.status !== "failed") return null;
  return <p {...props} data-aifk-tool-error="" role="alert">{children ?? tool.error ?? "The tool could not complete."}</p>;
}

export const ToolPrimitive = { Root, Name, Status, Output, Error: ToolError };
