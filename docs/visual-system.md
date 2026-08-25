# Visual system and product-quality defaults

## Default promise

Every official component must look finished when installed. The default design is intentionally neutral, contemporary, and suitable for a real product without carrying strong AIFrontKit branding.

Defaults include:

- balanced neutral surfaces with one restrained semantic accent;
- excellent typography, spacing, hierarchy, and content width;
- coordinated light, dark, and high-contrast modes;
- accessible focus, selection, status, disabled, and destructive states;
- responsive desktop, tablet, and mobile composition;
- complete empty, loading, streaming, interrupted, error, and recovery presentation;
- subtle motion that never delays an action or hides state.

“Neutral” does not mean unfinished gray boxes. It means visually polished, brand-compatible, and easy to move warmer, cooler, denser, softer, or more expressive through documented controls.

## Control model

Users customize the visual system at four levels:

1. **Global tokens** set brand color, neutral temperature, typography, spacing, radius, borders, shadows, density, and motion.
2. **Workspace scope** changes those values for a product area without creating a second design system.
3. **Component recipes and variants** select curated anatomy, layout, and presentation.
4. **Installed source** permits unrestricted product-specific changes.

Every supported control is serializable, documented, previewable, and represented in registry metadata. Arbitrary configuration bags and undocumented styling flags are prohibited.

## Motion controls

Motion is semantic rather than component-specific decoration. The shared contract includes:

- level: `none | subtle | expressive`;
- duration scale: instant, fast, normal, slow;
- easing families for enter, exit, movement, and emphasis;
- distance, scale, opacity, and stagger limits;
- named recipes for message entry, stream activity, panel transition, artifact update, tool progress, and approval attention;
- per-workspace and per-component overrides;
- automatic reduced-motion alternatives.

Animation must be interruptible, avoid layout instability, preserve focus, and never be the only way state is communicated. High-frequency streaming updates do not trigger entrance animation per token. Consequential actions do not use playful motion that weakens their seriousness.

## Variant quality

Variants must solve a recognizable product context, not merely change color:

- minimal: low visual weight for embedded assistants;
- conversation: comfortable general-purpose messaging;
- dense: information-rich support or operational views;
- workspace: conversation composed with sources, tasks, or artifacts;
- mobile: constrained navigation and touch-first actions.

Names describe purpose rather than copying another product's trade dress. Variants share primitives, behavior, tokens, and state contracts; only edge-level composition and visual treatment vary.

## Acceptance criteria

A component is not release-ready until the default and supported variants have been reviewed across themes, density, motion levels, narrow/wide viewports, long content, localization stress, keyboard use, screen readers, reduced motion, and representative failure states.
