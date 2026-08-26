---
title: Architecture
description: Understand AIFrontKit's contracts, runtime, interface, and distribution layers.
status: experimental
---

# Architecture

AIFrontKit separates external protocols, normalized state, framework bindings,
and visual source:

```text
customer backend → transport/adapter → core runtime → React primitives → registry UI
```

The core is framework-neutral. React subscribes through public selectors and
dispatches semantic commands. Adapters depend on core contracts but never on
React. Registry source may consume public package exports; packages never import
registry source.

The public repository never imports Pro or platform code. Downloaded public or
Pro UI runs without an AIFrontKit account or platform request.
