import type { ReactNode } from "react";
import { ToolPrimitive } from "@aifrontkit/react/tool";
import "./tool-call.css";

export interface ToolCallProps {
  toolCallId: string;
  className?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ToolCall({ toolCallId, className, icon, actions, children }: ToolCallProps) {
  return (
    <ToolPrimitive.Root toolCallId={toolCallId} className={["aifk-tool-call", className].filter(Boolean).join(" ")}>
      <header className="aifk-tool-call__header">
        <span className="aifk-tool-call__icon" aria-hidden="true">
          {icon ?? <svg viewBox="0 0 16 16"><path d="M4 3.5h8v9H4zM6.5 6h3M6.5 8.5h3" /></svg>}
        </span>
        <div className="aifk-tool-call__identity">
          <ToolPrimitive.Name />
          <ToolPrimitive.Status />
        </div>
        {actions ? <div className="aifk-tool-call__actions">{actions}</div> : null}
      </header>
      <div className="aifk-tool-call__content">{children ?? <><ToolPrimitive.Output /><ToolPrimitive.Error className="aifk-tool-call__error" /></>}</div>
    </ToolPrimitive.Root>
  );
}
