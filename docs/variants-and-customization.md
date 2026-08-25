# Variants and customization

## Four customization levels

1. **Tokens:** change brand, color, type, spacing, radius, density, shadow, and motion.
2. **Variants:** select curated structural/behavioral modes.
3. **Composition:** rearrange primitives, slots, blocks, and workspace zones.
4. **Source ownership:** install visual source and change any implementation detail.

These levels are cumulative; they do not produce four incompatible component systems.

Configuration is available globally, at workspace scope, and at component scope. Supported controls are typed and serializable so the same configuration can drive source code, previews, fixtures, documentation, and Studio.

## Variant model

Variants are schema-declared axes with finite values and documented combinations. Examples include `Message.presentation = minimal | bubble | card`, `Composer.layout = inline | floating | command`, and `Tool.presentation = compact | card | timeline`. Boolean behavior belongs in capabilities/configuration when it changes actions, not in arbitrary CSS flags.

Each component declares defaults, supported axes, mutually exclusive combinations, accessibility effects, token dependencies, and migration aliases. Invalid combinations produce development diagnostics and deterministic fallbacks.

Variants must represent a genuine context or composition—such as minimal, dense, workspace, or mobile—not duplicate an implementation for a cosmetic difference. Behavior, state transitions, and accessibility stay centralized beneath variant recipes.

Motion is configured through semantic recipes and bounded tokens rather than arbitrary animation strings. Products can select `none`, `subtle`, or `expressive`, adjust duration/easing/distance, and override individual recipes while reduced-motion behavior remains authoritative.

## Component-level customization

Components accept class/style hooks only as escape hatches. Stable customization uses slots, data attributes, semantic tokens, renderer injection, and controlled state/action props. DOM structure is not a compatibility guarantee unless explicitly documented.

## Source-owned upgrades

Registry metadata stores item/version provenance. Upgrade tooling compares the installed base, new upstream version, and local file, then offers a diff. It never silently replaces modified source. Schema or package migrations run separately and are previewable.

## Studio compatibility

Studio edits only declared tokens, variant axes, slots, and structural constraints. Unsupported custom source remains valid code but may be marked as partially visual-editable. Exported documents include no hidden hosted-only representation.
