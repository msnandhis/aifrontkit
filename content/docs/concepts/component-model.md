---
title: Component model
description: Understand AIFrontKit defaults, controlled variation, compound parts, and framework-neutral contracts.
status: experimental
---

# Component model

AIFrontKit uses progressive disclosure:

1. A polished default component handles the common case.
2. Named props control bounded choices such as variant, size, presentation, and motion.
3. Compound parts and typed renderer injection provide full composition.

Framework-neutral contracts under `contracts/ui` define purpose, anatomy, states,
variants, and accessibility. `registry/react/css` is one implementation of those
contracts. React markup and CSS class names are therefore not the cross-framework
product API.

Stable `data-slot`, `data-state`, `data-role`, and `data-variant` attributes make
source customization deliberate. Semantic tokens carry theme decisions. Consumers
can replace renderers or rearrange compound parts without duplicating runtime logic.

