---
title: Motion
description: Apply quiet semantic motion with complete reduced-motion behavior.
status: experimental
---

# Motion

Motion communicates state and spatial change; it is not ambient decoration. Theme
levels are `none`, `subtle`, and `expressive`, while component recipes describe
the meaning of a transition such as disclosure, status change, or pane entry.

Do not animate every streamed token. Prefer a quiet activity indicator and stable
content layout. Avoid large parallax, glow, bounce, and competing perpetual
animations in product UI.

Every recipe must have a reduced-motion result that preserves information. Motion
must not delay input, hide focus, reorder reading unexpectedly, or become the only
signal for completion or failure.
