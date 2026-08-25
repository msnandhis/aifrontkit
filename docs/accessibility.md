# Accessibility

## Target

Public primitives and official UI target WCAG 2.2 AA. Accessibility requirements are part of capability contracts and release gates, not optional documentation.

## Core behavior

- Complete keyboard operation with visible focus and logical order.
- Correct landmarks, names, roles, states, and relationships.
- Focus restoration for dialogs, menus, panes, approvals, and artifact transitions.
- Screen-reader announcements for connection/status changes, completed responses, errors, and consequential actions.
- No token-by-token live-region noise during streaming.
- Reduced-motion support and no information conveyed only by color, sound, or animation.
- Minimum target sizes and contrast preserved under supported theme overrides.

## AI-specific rules

Reasoning, tool, task, and approval components expose meaningful status text. Citations connect claims and sources accessibly. Composer shortcuts are discoverable and do not trap assistive technology. New streamed content does not steal focus or force scroll when the user has moved away.

Media requires alt text paths, captions/transcripts when provided, keyboard controls, and safe fallbacks. Generated content is not assumed to be accessible; renderers expose author/customer hooks for missing descriptions.

## Testing

Automated axe-style scans are necessary but insufficient. Each significant component receives keyboard, screen-reader smoke, zoom/reflow, high-contrast, reduced-motion, and mobile target review. Official experiences are tested end to end, not only component-by-component.

## Source-owned responsibility

Installed components start accessible. Upgrade diffs call out accessibility fixes. Documentation warns when customer source changes, tokens, or custom renderers can invalidate guarantees.

