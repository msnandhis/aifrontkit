---
title: AIFrontKit documentation
description: Build accessible, source-owned interfaces for production AI applications.
status: experimental
---

# AIFrontKit

AIFrontKit is a frontend system for production AI applications. It provides a
framework-neutral interaction runtime, React behavior primitives, optional
protocol adapters, semantic design tokens, and source-installed UI.

AIFrontKit does not choose a model, run an agent, proxy credentials, or require a
hosted account at runtime. Your backend remains responsible for inference and
tool execution; AIFrontKit renders and manages the browser interaction layer.

Start with [installation](./start/installation.md), then build a
[first conversation](./start/first-conversation.md). If your backend already
speaks AI SDK UI streams or AG-UI, select the matching adapter. Otherwise use the
small custom transport contract.

> AIFrontKit is currently prerelease software. Public contracts may change with
> documented migrations before v1.
