---
title: Task primitive
description: Render observable long-running agent work without coupling UI to an agent runtime.
status: experimental
---

# Task primitive

`TaskPrimitive` renders controlled `AgentTask` data or selects a task by `taskId`
from `AIFrontKitProvider`. It exposes title, status, progress, ordered steps,
step progress, stop and resume actions and accessible errors.

The primitive does not expose hidden reasoning or execute stop and resume
commands. Those buttons call application-owned handlers that can send canonical
commands through a transport.

Install the `agent-progress` registry block for an editable production
composition.
