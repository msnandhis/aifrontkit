"use client";

import type { AgentTask } from "@aifrontkit/core";
import { TaskPrimitive } from "@aifrontkit/react/task";

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

const rootClass = "aifk-agent-progress grid gap-[var(--aifk-space-4,1rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent p-[var(--aifk-space-4,1rem)] text-[var(--aifk-text,CanvasText)] motion-reduce:[&_*,&_ *::before,&_ *::after]:duration-[0.01ms]!";
const headerClass = "aifk-agent-progress__header flex items-center gap-[var(--aifk-space-3,0.75rem)]";
const iconClass = "aifk-agent-progress__icon grid size-9 shrink-0 place-items-center bg-transparent text-[var(--aifk-accent,CanvasText)] [&_svg]:w-4 [&_svg]:fill-none [&_svg]:stroke-current [&_svg]:stroke-[1.5] [&_svg]:[stroke-linecap:round]";
const actionsClass = "aifk-agent-progress__actions ms-auto flex gap-[var(--aifk-space-2,0.5rem)] [&_button]:min-h-11 [&_button]:min-w-11 [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-medium,0.625rem)] [&_button]:border [&_button]:border-[var(--aifk-border,ButtonBorder)] [&_button]:bg-transparent [&_button]:px-[var(--aifk-space-3,0.75rem)] [&_button]:text-inherit [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-offset-2 [&_button]:focus-visible:outline-[var(--aifk-focus,Highlight)]";
const progressClass = "w-full accent-[var(--aifk-accent,Highlight)]";
const stepClass = "aifk-agent-progress__step group/step grid grid-cols-[auto_1fr] items-start gap-[var(--aifk-space-3,0.75rem)]";
const markerClass = "aifk-agent-progress__marker mt-[0.35rem] size-2.5 rounded-full bg-[var(--aifk-border-strong,ButtonBorder)] group-data-[status=running]/step:bg-[var(--aifk-accent,Highlight)] group-data-[status=complete]/step:bg-[var(--aifk-success,CanvasText)] group-data-[status=failed]/step:bg-[var(--aifk-destructive,CanvasText)]";

export interface AgentProgressProps {
  task?: AgentTask;
  taskId?: string;
  className?: string;
  onStop?(): void;
  onResume?(): void;
}

export function AgentProgress({ task, taskId, className, onStop, onResume }: AgentProgressProps) {
  const rootProps = task ? { task } : taskId ? { taskId } : undefined;
  if (!rootProps) throw new Error("AgentProgress requires either `task` or `taskId`.");
  return (
    <TaskPrimitive.Root {...rootProps} className={cx(rootClass, className)}>
      <header className={headerClass}>
        <span className={iconClass} aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="M3 5.5h14M3 10h9M3 14.5h6" /></svg>
        </span>
        <div className="aifk-agent-progress__identity min-w-0">
          <TaskPrimitive.Title className="aifk-agent-progress__title m-0 text-[length:var(--aifk-type-font-size-sm,0.875rem)]" />
          <TaskPrimitive.Status className="aifk-agent-progress__status text-[length:var(--aifk-type-font-size-xs,0.75rem)] capitalize text-[var(--aifk-text-muted,GrayText)]" />
        </div>
        <div className={actionsClass}>
          {onStop ? <TaskPrimitive.Stop onClick={onStop} /> : null}
          {onResume ? <TaskPrimitive.Resume onClick={onResume} /> : null}
        </div>
      </header>
      <TaskPrimitive.Progress className={cx("aifk-agent-progress__progress", progressClass)} />
      <TaskPrimitive.Steps className="aifk-agent-progress__steps m-0 grid list-none gap-[var(--aifk-space-3,0.75rem)] p-0">
        {(stepId) => (
          <TaskPrimitive.Step stepId={stepId} className={stepClass}>
            <span className={markerClass} aria-hidden="true" />
            <div>
              <TaskPrimitive.StepTitle className="aifk-agent-progress__step-title block text-[length:var(--aifk-type-font-size-sm,0.875rem)] font-[var(--aifk-type-font-weight-semibold,600)]" />
              <TaskPrimitive.StepStatus className="aifk-agent-progress__step-status text-[length:var(--aifk-type-font-size-xs,0.75rem)] capitalize text-[var(--aifk-text-muted,GrayText)]" />
              <TaskPrimitive.StepProgress className={cx("aifk-agent-progress__step-progress", progressClass)} />
            </div>
          </TaskPrimitive.Step>
        )}
      </TaskPrimitive.Steps>
      <TaskPrimitive.Error className="aifk-agent-progress__error m-0 text-[var(--aifk-destructive,CanvasText)]" />
    </TaskPrimitive.Root>
  );
}
