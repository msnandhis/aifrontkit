---
title: Agent progress
description: Keep long-running work observable, interruptible and recoverable without exposing hidden reasoning.
status: experimental
---

# Agent progress

`AgentProgress` is a source-owned production block built on `TaskPrimitive`. It
renders task status, ordered steps, determinate progress, failure context and
application-owned stop or resume actions.

## When to use it

Use this pattern when work lasts long enough that a generic spinner stops being
informative. Each step represents an observable product milestone, not private
model reasoning.

| State | Interface responsibility |
| --- | --- |
| Running | Show the active step and offer stop only when the application can honor it. |
| Awaiting approval | Explain what has blocked progress without implying that work is advancing. |
| Paused | Preserve completed history and expose one intentional recovery action. |
| Complete | Keep the evidence trail visible and remove active controls. |
| Failed | Attach the failure to the affected task or step and keep successful work intact. |

## Application boundary

The pattern does not execute or resume an agent. Bind `task` to the canonical
runtime projection and send stop or resume intent through your adapter. Update
the rendered state only after your backend confirms the transition.

```tsx
<AgentProgress
  task={runtime.tasks[taskId]}
  onStop={() => transport.send({ type: "task.stop", taskId })}
  onResume={() => transport.send({ type: "task.resume", taskId })}
/>
```
