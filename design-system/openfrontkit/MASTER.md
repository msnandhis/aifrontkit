# OpenFrontKit design system

This is the visual source of truth for official Community and Pro registry items. Page or workspace overrides may refine these rules but may not weaken accessibility, focus, or reduced-motion guarantees.

## Direction

- Product category: reusable AI application component system.
- Tone: calm, precise, contemporary, professional, and brand-neutral.
- Variance: restrained. Hierarchy comes from typography, spacing, and surface contrast rather than decorative effects.
- Density: comfortable by default with compact and spacious options.
- Motion: subtle by default, optional, semantic, interruptible.
- Default components must feel finished without resembling a named AI product.

## Color

Use semantic `--aifk-*` variables exclusively in component source.

### Light

| Role | Value |
| --- | --- |
| Canvas | `#ffffff` |
| Subtle canvas | `#fafafa` |
| Surface | `#f5f5f5` |
| Elevated surface | `#ffffff` |
| Primary text | `#171717` |
| Secondary text | `#525252` |
| Muted text | `#737373` |
| Border | `#e5e5e5` |
| Strong border | `#d4d4d4` |
| Accent | `#4f46e5` |
| Accent foreground | `#ffffff` |
| Focus | `#4f46e5` |
| Destructive | `#b91c1c` |
| Success | `#047857` |
| Warning | `#a16207` |

### Dark

Dark mode uses deliberate tonal mappings, not inverted light colors.

| Role | Value |
| --- | --- |
| Canvas | `#0a0a0a` |
| Subtle canvas | `#111111` |
| Surface | `#171717` |
| Elevated surface | `#1f1f1f` |
| Primary text | `#fafafa` |
| Secondary text | `#d4d4d4` |
| Muted text | `#a3a3a3` |
| Border | `#2e2e2e` |
| Strong border | `#404040` |
| Accent | `#818cf8` |
| Accent foreground | `#171717` |
| Focus | `#a5b4fc` |
| Destructive | `#f87171` |
| Success | `#34d399` |
| Warning | `#facc15` |

High-contrast mode strengthens border, focus, and foreground separation without changing semantic meaning. Normal text targets WCAG 2.2 AA contrast of at least 4.5:1. State is never communicated by color alone.

## Typography

- Default stack: `Inter, ui-sans-serif, system-ui, sans-serif`; never require a network font for correctness.
- Body: 16px/1.5.
- Secondary and labels: 14px/1.45; never use body text below 12px.
- Code: `ui-monospace, SFMono-Regular, Menlo, monospace`.
- Weights: 400 body, 500 labels/actions, 600 headings.
- Long prose measure: 65–75 characters.

## Space, shape, and density

- Four-pixel base rhythm with primary steps 4, 8, 12, 16, 24, 32, 48, 64.
- Comfortable interactive targets are at least 44×44px on touch-capable layouts.
- Radius scale: 0, 6, 10, 14, 20, full. Default component radius: 14px.
- Shadows are restrained; borders and surface tone establish most hierarchy.
- Compact mode reduces whitespace, not touch safety or readable type.

## Message component

- Assistant messages use the canvas/surface hierarchy, never a loud branded bubble by default.
- User messages may use a subtle elevated or tinted surface with readable maximum width.
- System messages use low emphasis with explicit labeling.
- Streaming status is separate from content; do not announce every token.
- Failed or interrupted states retain partial content and show readable status plus recovery slots.
- Variants:
  - `minimal`: near-chromeless embedded output.
  - `conversation`: comfortable default thread presentation.
  - `dense`: reduced vertical space for operational/support contexts.
  - `workspace`: wider structured content and adjacent-action affordances.
- Variants share behavior and state; only composition and visual recipe differ.

## Motion

Motion levels:

| Level | Behavior |
| --- | --- |
| `none` | No decorative movement; state remains immediate and understandable. |
| `subtle` | Default. 150–220ms opacity/translate transitions with 4–8px distance. |
| `expressive` | 220–320ms transitions with at most 12px distance and limited stagger. |

- Enter uses ease-out; exit is approximately 65% of enter duration and uses ease-in.
- Animate transform and opacity, not layout dimensions.
- Do not animate on every streamed token.
- Animations never block interaction and must be interruptible.
- `prefers-reduced-motion: reduce` overrides every configured level.
- Focus must remain visible and stable through transitions.

## Responsive and interaction rules

- Validate at 375, 768, 1024, and 1440px.
- No horizontal overflow from code, tool output, or long unbroken content.
- Primary actions do not rely on hover and show pressed/disabled feedback.
- Icon-only controls require accessible names and a consistent vector icon language.
- Interactive source components use semantic HTML before ARIA.

## Testing matrix

- Light, dark, and high contrast.
- Comfortable and compact density.
- None, subtle, and expressive motion plus operating-system reduced motion.
- User, assistant, and system roles.
- Streaming, complete, failed, interrupted, and long-content fixtures.
- Keyboard, screen-reader status behavior, 200% zoom, narrow/wide viewports.

## Prohibited patterns

- Product-clone styling or component names.
- Raw hex colors inside component implementations.
- Decorative gradients, glass effects, or large shadows as default identity.
- Layout-shifting hover effects.
- Placeholder-only form labels.
- Token-by-token live-region announcements.
- Runtime license checks or platform calls in downloaded source.
