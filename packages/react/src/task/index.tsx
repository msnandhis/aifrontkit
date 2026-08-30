import { createContext, useContext, type ComponentPropsWithoutRef, type PropsWithChildren, type ReactNode } from "react";
import type { AgentTask, TaskStep } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

const TaskContext = createContext<AgentTask | null>(null);
const StepContext = createContext<TaskStep | null>(null);

export interface TaskRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  task?: AgentTask;
  taskId?: string;
}

function TaskFrame({ task, children, ...props }: Omit<TaskRootProps, "taskId"> & { task: AgentTask }) {
  const busy = task.status === "queued" || task.status === "running";
  return <TaskContext.Provider value={task}><section aria-label={`Task: ${task.title}`} aria-busy={busy} data-aifk-task="" data-status={task.status} {...props}>{children}</section></TaskContext.Provider>;
}

function RuntimeTask({ taskId, ...props }: Omit<TaskRootProps, "task"> & { taskId: string }) {
  const task = useRuntimeState((state) => state.tasks[taskId]);
  return task ? <TaskFrame {...props} task={task} /> : null;
}

function Root({ task, taskId, ...props }: TaskRootProps) {
  if (task) return <TaskFrame {...props} task={task} />;
  if (taskId) return <RuntimeTask {...props} taskId={taskId} />;
  throw new Error("TaskPrimitive.Root requires either `task` or `taskId`.");
}

function Title(props: ComponentPropsWithoutRef<"h3">) {
  const task = useTask();
  return <h3 {...props}>{props.children ?? task.title}</h3>;
}

function Status(props: ComponentPropsWithoutRef<"span">) {
  const task = useTask();
  return <span role="status" aria-atomic="true" {...props}>{props.children ?? task.status}</span>;
}

function Progress({ label, ...props }: Omit<ComponentPropsWithoutRef<"progress">, "value" | "max"> & { label?: string }) {
  const task = useTask();
  if (!task.progress) return null;
  const progressProps = task.progress.total === undefined ? {} : { value: task.progress.current, max: task.progress.total };
  return <progress aria-label={label ?? task.progress.label ?? `${task.title} progress`} {...progressProps} {...props} />;
}

function Steps({ children, ...props }: Omit<ComponentPropsWithoutRef<"ol">, "children"> & { children?: (stepId: string) => ReactNode }) {
  const task = useTask();
  if (task.stepOrder.length === 0) return null;
  return <ol {...props}>{task.stepOrder.map((stepId) => <li key={stepId}>{children ? children(stepId) : <Step stepId={stepId}><StepTitle /><StepStatus /></Step>}</li>)}</ol>;
}

function Step({ step, stepId, children, ...props }: PropsWithChildren<ComponentPropsWithoutRef<"div">> & { step?: TaskStep; stepId?: string }) {
  const task = useTask();
  const value = step ?? (stepId ? task.steps[stepId] : undefined);
  if (!value) return null;
  return <StepContext.Provider value={value}><div data-aifk-task-step="" data-status={value.status} {...props}>{children}</div></StepContext.Provider>;
}

function StepTitle(props: ComponentPropsWithoutRef<"span">) {
  const step = useStep();
  return <span {...props}>{props.children ?? step.title}</span>;
}

function StepStatus(props: ComponentPropsWithoutRef<"span">) {
  const step = useStep();
  return <span {...props}>{props.children ?? step.status}</span>;
}

function StepProgress({ label, ...props }: Omit<ComponentPropsWithoutRef<"progress">, "value" | "max"> & { label?: string }) {
  const step = useStep();
  if (!step.progress) return null;
  const progressProps = step.progress.total === undefined ? {} : { value: step.progress.current, max: step.progress.total };
  return <progress aria-label={label ?? step.progress.label ?? `${step.title} progress`} {...progressProps} {...props} />;
}

function TaskError(props: ComponentPropsWithoutRef<"p">) {
  const task = useTask();
  if (task.status !== "failed") return null;
  return <p role="alert" {...props}>{props.children ?? task.error ?? "The task could not complete."}</p>;
}

function Stop(props: ComponentPropsWithoutRef<"button">) {
  const task = useTask();
  if (task.status !== "queued" && task.status !== "running") return null;
  return <button type="button" {...props}>{props.children ?? "Stop"}</button>;
}

function Resume(props: ComponentPropsWithoutRef<"button">) {
  const task = useTask();
  if (task.status !== "paused" && task.status !== "failed") return null;
  return <button type="button" {...props}>{props.children ?? "Resume"}</button>;
}

function useTask() {
  const task = useContext(TaskContext);
  if (!task) throw new Error("TaskPrimitive component must be inside TaskPrimitive.Root.");
  return task;
}

function useStep() {
  const step = useContext(StepContext);
  if (!step) throw new Error("TaskPrimitive step component must be inside TaskPrimitive.Step.");
  return step;
}

export const TaskPrimitive = { Root, Title, Status, Progress, Steps, Step, StepTitle, StepStatus, StepProgress, Stop, Resume, Error: TaskError };
