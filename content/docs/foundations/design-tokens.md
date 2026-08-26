---
title: Design tokens
description: Use layered foundation, semantic, and component tokens without coupling UI to one brand.
status: experimental
---

# Design tokens

AIFrontKit uses four layers: foundation scales, semantic roles, component recipes,
and local variants. Components consume semantic roles such as `canvas`, `surface`,
`text`, `border`, `action`, and `focus`; they do not depend directly on a fixed
brand palette.

The default visual direction is graphite-neutral in light and dark modes. Primary
actions are near-black or near-white. Blue is a functional accent rather than a
decorative brand wash. High contrast is a first-class mode, not a late override.

Spacing, radius, typography, density, and motion use the same layered approach.
Installed components inherit host typography unless the consumer opts into an
AIFrontKit font stack.
