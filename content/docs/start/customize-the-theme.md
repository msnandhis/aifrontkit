---
title: Customize the theme
description: Change neutral AIFrontKit defaults through semantic tokens and controlled recipes.
status: experimental
---

# Customize the theme

AIFrontKit starts with neutral, accessible surfaces and inherits the host
application's font. Customize semantic roles such as canvas, surface, text,
border, action, focus, danger, and success instead of replacing colors inside
individual components.

Supported theme axes include appearance, neutral temperature, accent, density,
radius, type scale, surface contrast, and motion level. Keep these axes
independent: a compact workspace should not require a separate dark-compact
component variant.

Use blue for functional emphasis such as links, focus, selected navigation, and
information. Reserve status colors for real states. Test every supported override
for contrast, visible focus, reduced motion, zoom, and narrow layouts.
