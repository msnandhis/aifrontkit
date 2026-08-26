---
title: Component playgrounds
description: Understand how controls, previews, generated code, presets, and quality fixtures stay synchronized.
status: experimental
---

# Component playgrounds

Every source component ships with an interactive documentation playground. It
is a consumer-facing API explorer, not a substitute for the deterministic
quality fixtures used by automated review.

## One source of truth

A typed state object feeds both the real registry component and its code
generator:

```text
typed playground state
  ├─ real component preview
  ├─ complete generated source
  ├─ shareable URL parameters
  └─ accessible control values
```

The preview must never read content hidden from the code generator. Message
text, file metadata, tool input and output, labels, statuses, variants, and slot
content must match exactly.

## Controls

Expose every meaningful public option through a labelled native control.
Organize controls as Content, Appearance, Behavior, Slots, and Advanced.
Frequently changed groups open by default; specialized options use progressive
disclosure. Invalid or impossible combinations should be hidden, disabled with
an explanation, or rejected by the typed definition.

Callbacks are represented by working preview actions and a polite event log.
They are not editable strings. Complex application-owned renderers use bounded
slot toggles and complete generated compositions.

## Presets

Presets set several controls to a reviewed configuration. They should cover the
recommended default plus meaningful empty, loading, streaming, complete,
interrupted, failed, cancelled, long-content, RTL, localization, and workspace
states when the component supports them. Editing any preset creates a Custom
configuration without losing the selected values.

## Generated code

Generated examples must be complete, copyable, formatted, and type-valid. They
include required imports, normalized data, providers, runtime setup, and local
callbacks. Do not reference unexplained variables or illustrative helper
components. Syntax presentation distinguishes component tags, prop names,
literal values, JavaScript keywords, comments, and punctuation without relying
on color alone.

## Responsive review

Preview width controls provide responsive, tablet, and mobile frames. The
playground itself must remain keyboard accessible, usable at 200% zoom, bounded
at 375px, and readable in light, dark, RTL, and reduced-motion environments.

## Authoring contract

Each new component contributes one typed definition containing:

1. Recommended defaults.
2. Curated presets.
3. Public controls with labels and descriptions.
4. A renderer that mounts real registry source.
5. A code generator derived from the same state.
6. Browser tests for control-to-preview and control-to-code synchronization.

Quality fixtures remain colocated with registry source and deterministic.
Playground definitions live in the documentation application because they own
interactive explanation rather than distributed component behavior.
