import { ToolPrimitive } from "@aifrontkit/react/tool";

export function ToolCall({ toolCallId }: { toolCallId: string }) {
  return (
    <ToolPrimitive.Root toolCallId={toolCallId} className="aifk-tool-call">
      <header><ToolPrimitive.Name /> <ToolPrimitive.Status /></header>
      <ToolPrimitive.Output />
    </ToolPrimitive.Root>
  );
}
