# AIFrontKit design system

This document is the visual source of truth for AIFrontKit Community and Pro registry items. Page and workspace recipes may refine it, but they may not weaken accessibility, focus visibility, responsive behavior, or reduced-motion guarantees.

## Product direction

- Product category: reusable frontend infrastructure for AI applications.
- Tone: quiet, technical, editorial, precise, and brand-compatible.
- Visual variance: 4/10. Use measured asymmetry and hierarchy, not decorative novelty.
- Default motion: 3/10. Motion explains state and position; it does not decorate streamed output.
- Default density: comfortable for product UI and moderately dense for documentation.
- Official components must look finished without resembling a named AI product.

The website and documentation may use the AIFrontKit brand typeface. Installed registry source inherits the host application's typeface by default.

## Token layers

```text
foundation values
  -> semantic tokens
    -> component-local recipes
      -> finite variants and source overrides
```

1. Foundation values define type, space, radius, elevation, duration, easing, and color scales.
2. Semantic tokens describe intent such as canvas, text, border, action, link, focus, and status.
3. Component recipes map semantic tokens to one capability without entering the global contract.
4. Variants solve a product context. Installed source remains the final escape hatch.

Raw colors are prohibited inside official component implementations. Component-only variables use the `--aifk-<component>-*` prefix and fall back to public semantic tokens.

## Color

The default family is neutral graphite. Blue is functional: links, focus, selected navigation, and informational state. Primary actions are neutral rather than blue. Tool, reasoning, approval, and artifact surfaces are neutral by default; semantic status is communicated through labels, icons, and restrained accents.

### Light

| Role | Value |
| --- | --- |
| Canvas | `#ffffff` |
| Subtle canvas | `#fafafa` |
| Surface | `#f6f6f7` |
| Elevated surface | `#ffffff` |
| Primary text | `#18181b` |
| Secondary text | `#5f6068` |
| Muted text | `#7c7d86` |
| Border | `#e7e7e9` |
| Strong border | `#d4d4d8` |
| Primary action | `#18181b` |
| Primary action foreground | `#ffffff` |
| Primary action hover | `#27272a` |
| Link/accent | `#315ed8` |
| Focus | `#315ed8` |

### Dark

| Role | Value |
| --- | --- |
| Canvas | `#0d0d0f` |
| Subtle canvas | `#111113` |
| Surface | `#171719` |
| Elevated surface | `#1d1d20` |
| Primary text | `#f4f4f5` |
| Secondary text | `#b0b0b7` |
| Muted text | `#898991` |
| Border | `#29292d` |
| Strong border | `#3a3a40` |
| Primary action | `#f4f4f5` |
| Primary action foreground | `#18181b` |
| Primary action hover | `#ffffff` |
| Link/accent | `#8eaaff` |
| Focus | `#8eaaff` |

High-contrast mode strengthens border, focus, and foreground separation without changing semantic meaning. Normal text targets WCAG 2.2 AA contrast of at least 4.5:1. State is never communicated by color alone.

## Typography

- AIFrontKit website/docs: Geist Sans with Geist Mono or JetBrains Mono for code.
- Installed components: `inherit`, followed by the host system stack as a safe fallback.
- Body: 16px/1.55.
- Secondary text and labels: 14px/1.45; never use functional body text below 12px.
- Weights: 400 body, 500 controls, 600 headings, 650 only for compact product labels.
- Large headings use tighter tracking and balanced wrapping.
- Long prose measure: 65-75 characters. Conversation content measure: approximately 680-720px.
- Numeric metadata uses tabular figures.

## Space, shape, and elevation

- Four-pixel base rhythm with primary steps 4, 8, 12, 16, 20, 24, 32, 48, and 64.
- Touch targets remain at least 44x44px on touch-capable layouts.
- Radius scale: 0, 6, 10, 14, 20, full. Inner controls use a tighter radius than their container.
- Borders and surface contrast establish hierarchy. Shadows are reserved for overlays and actual elevation.
- Compact mode reduces whitespace, not touch safety, focus visibility, or readable type.
- Z-index follows a documented semantic scale; arbitrary values are prohibited.

## Component layers

- `@aifrontkit/react` owns headless, runtime-bound compound primitives.
- `registry/ui` owns editable native-first visual building blocks.
- `registry/react/css/components` owns the default React/CSS capability presentation.
- `registry/react/css/patterns` owns React/CSS multi-component interaction flows.
- `registry/blocks` owns complete product sections.
- `registry/workspaces` owns responsive application shells.

Do not create a second primitives package until another framework creates a real independent release boundary.

## Conversation and message

- Conversation owns transcript layout, scroll-follow behavior, empty state, and scroll-to-latest affordance.
- Conversation does not own transport or model execution and does not require a composer.
- Assistant messages are primarily chromeless.
- User messages use a quiet neutral surface with a constrained width.
- System messages use low emphasis with explicit labeling.
- Role labels appear only when context requires them.
- Streaming status is separate from content; streamed tokens are not individual live-region announcements.
- Failed and interrupted messages retain partial content and expose recovery slots.
- Message actions remain keyboard reachable and become visually prominent on hover or focus-within.
- Rich content such as code, citations, attachments, tool calls, and reasoning uses dedicated renderers.

Conversation presentations are `embedded`, `full-height`, and `workspace`. Message presentations are `minimal`, `conversation`, `dense`, and `workspace`. Density and motion remain separate axes.

## Motion

| Level | Behavior |
| --- | --- |
| `none` | No decorative movement; state remains immediate and understandable. |
| `subtle` | Default. 120-220ms opacity/translate transitions with 2-8px distance. |
| `expressive` | 180-300ms transitions with at most 12px distance and limited stagger. |

- Enter uses ease-out; exit is shorter and uses ease-in.
- Animate transform and opacity, never layout dimensions.
- Do not animate on every streamed token.
- Motion is interruptible, preserves focus, and never delays an action.
- `prefers-reduced-motion: reduce` overrides every configured level.

## Responsive and interaction rules

- Validate at 375, 768, 1024, and 1440px.
- No horizontal overflow from code, tool output, tables, or long unbroken content.
- Primary actions do not rely on hover and show hover, pressed, disabled, and loading feedback.
- Icon-only controls require accessible names and a consistent SVG icon language.
- Use semantic HTML before ARIA.
- Documentation pages include a skip link, sequential headings, visible current navigation, predictable browser history, and useful search-empty states.

## Testing matrix

- Light, dark, and high contrast.
- Comfortable and compact density.
- None, subtle, and expressive motion plus operating-system reduced motion.
- User, assistant, and system roles.
- Empty, loading, streaming, complete, failed, interrupted, and long-content fixtures.
- Keyboard, screen-reader status behavior, 200% zoom, RTL, narrow/wide viewports, and localization stress.

## Prohibited patterns

- Product-clone styling or trademark-derived component names.
- Purple/blue AI gradients, glow, glass, or large decorative shadows as default identity.
- Raw hex colors inside component implementations.
- Colored capability surfaces when a neutral surface plus semantic status is sufficient.
- Layout-shifting hover effects or motion on each streamed token.
- Placeholder-only form labels or hover-only actions.
- Runtime license checks or platform calls in downloaded source.
