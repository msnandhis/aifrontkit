---
title: Component name
description: One sentence describing the user problem this capability solves.
status: template
---

# Component name

Identify the capability as a headless primitive, source-installed visual
component, pattern, block, or workspace. Explain what it owns and what remains
the host application's responsibility.

## Preview

Embed the typed component playground. Every public option must be represented by
a labelled control or documented as intentionally excluded. Preview and
generated code must use the same state and exact content values. Include
recommended presets for meaningful lifecycle, responsive, localization, and
failure states. A screenshot must never be the only preview.

## Installation

Include exact package or registry installation commands and peer requirements.

## Usage

Provide the smallest complete example.

## Anatomy

Document compound parts, slots, and their relationships.

## Variants and states

Cover empty, loading, streaming, complete, interrupted, failed, and disabled
states where relevant.

Explain meaningful structural variants, supported composition, and when to avoid
the component. Cover empty, loading, streaming, complete, interrupted, failed,
cancelled, and disabled states only where the actual API supports them.

## API reference

Document public props, hooks, emitted actions, runtime requirements, and stable
selectors. Generated API reference may be embedded here.

Use a table for public props and compound parts. Separate source-component props
from primitive props. Document stable `data-slot` or `data-aifk-*` selectors.

## Styling and motion

List semantic tokens and motion recipes. Include reduced-motion behavior.

## Accessibility

Document names, roles, states, keyboard interaction, focus management, live
announcements, contrast, zoom/reflow, and touch targets.

## Responsive behavior

Define supported narrow, embedded, and workspace layouts.

## Errors and recovery

Show partial-content preservation, retry/cancel behavior, and actionable errors.

## Testing

List deterministic fixtures, interaction coverage, accessibility checks, and
consumer compatibility tests.

## Compatibility

State package, schema, React, registry, and browser compatibility. Link breaking
changes and migrations.
