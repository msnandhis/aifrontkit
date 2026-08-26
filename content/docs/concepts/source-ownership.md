---
title: Source ownership
description: Understand why behavior ships as packages while visual UI ships as editable source.
status: experimental
---

# Source ownership

Stable behavior, state, selectors, and adapter contracts ship as versioned npm
packages. Visual components, patterns, blocks, workspaces, and themes primarily
ship as registry source copied into the customer application.

This gives teams control over markup, styling, branding, composition, and local
product constraints while avoiding duplicated runtime behavior. Registry
metadata records provenance and compatibility so future upgrades can show a diff
instead of overwriting local changes.

Accessibility is included in the installed source, but customer modifications can
invalidate it. Preserve semantic markup, keyboard behavior, focus management,
status announcements, and supported token contrast when customizing.
