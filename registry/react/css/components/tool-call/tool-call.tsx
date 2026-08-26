"use client";

import type { ReactNode } from "react";
import { ToolPrimitive } from "@aifrontkit/react/tool";
import styles from "./tool-call.module.css";

function slot(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

export interface ToolCallProps {
  toolCallId: string;
  className?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function ToolCall({ toolCallId, className, icon, actions, children }: ToolCallProps) {
  return (
    <ToolPrimitive.Root toolCallId={toolCallId} className={slot("aifk-tool-call", className)} data-slot="tool-call">
      <header className={slot("aifk-tool-call__header")} data-slot="tool-call-header">
        <span className={slot("aifk-tool-call__icon")} aria-hidden="true">
          {icon ?? <svg viewBox="0 0 16 16"><path d="M4 3.5h8v9H4zM6.5 6h3M6.5 8.5h3" /></svg>}
        </span>
        <div className={slot("aifk-tool-call__identity")}>
          <ToolPrimitive.Name />
          <ToolPrimitive.Status />
        </div>
        {actions ? <div className={slot("aifk-tool-call__actions")} data-slot="tool-call-actions">{actions}</div> : null}
      </header>
      <div className={slot("aifk-tool-call__content")} data-slot="tool-call-content">{children ?? <><ToolPrimitive.Output /><ToolPrimitive.Error className={slot("aifk-tool-call__error")} /></>}</div>
    </ToolPrimitive.Root>
  );
}
