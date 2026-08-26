---
title: Accessibility
description: Build AI interactions that meet WCAG 2.2 AA and remain understandable during streaming and recovery.
status: experimental
---

# Accessibility

Official primitives and UI target WCAG 2.2 AA. Keyboard operation, logical focus,
visible focus, correct roles and names, zoom/reflow, contrast, touch targets, and
reduced motion are release requirements.

Streaming content must not generate token-by-token live-region noise or steal
focus. Announce meaningful status changes such as completion, interruption,
failure, and consequential approval outcomes. If a reader scrolls away from the
latest content, preserve their position.

Automated checks are necessary but insufficient. Significant capabilities require
keyboard, screen-reader smoke, high-contrast, reduced-motion, mobile target, and
responsive reviews against deterministic states.
