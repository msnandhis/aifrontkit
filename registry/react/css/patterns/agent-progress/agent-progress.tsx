"use client";

import type { AgentTask } from "@aifrontkit/core";
import { TaskPrimitive } from "@aifrontkit/react/task";
import styles from "./agent-progress.module.css";

function classes(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

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
    <TaskPrimitive.Root {...rootProps} className={classes("aifk-agent-progress", className)}>
      <header className={classes("aifk-agent-progress__header")}>
        <span className={classes("aifk-agent-progress__icon")} aria-hidden="true">
          <svg viewBox="0 0 20 20"><path d="M3 5.5h14M3 10h9M3 14.5h6" /></svg>
        </span>
        <div className={classes("aifk-agent-progress__identity")}>
          <TaskPrimitive.Title className={classes("aifk-agent-progress__title")} />
          <TaskPrimitive.Status className={classes("aifk-agent-progress__status")} />
        </div>
        <div className={classes("aifk-agent-progress__actions")}>
          {onStop ? <TaskPrimitive.Stop onClick={onStop} /> : null}
          {onResume ? <TaskPrimitive.Resume onClick={onResume} /> : null}
        </div>
      </header>
      <TaskPrimitive.Progress className={classes("aifk-agent-progress__progress")} />
      <TaskPrimitive.Steps className={classes("aifk-agent-progress__steps")}>
        {(stepId) => (
          <TaskPrimitive.Step stepId={stepId} className={classes("aifk-agent-progress__step")}>
            <span className={classes("aifk-agent-progress__marker")} aria-hidden="true" />
            <div>
              <TaskPrimitive.StepTitle className={classes("aifk-agent-progress__step-title")} />
              <TaskPrimitive.StepStatus className={classes("aifk-agent-progress__step-status")} />
              <TaskPrimitive.StepProgress className={classes("aifk-agent-progress__step-progress")} />
            </div>
          </TaskPrimitive.Step>
        )}
      </TaskPrimitive.Steps>
      <TaskPrimitive.Error className={classes("aifk-agent-progress__error")} />
    </TaskPrimitive.Root>
  );
}
