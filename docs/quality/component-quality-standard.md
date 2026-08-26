# Component quality standard

## Purpose

This standard defines what AIFrontKit means by a polished, production-ready component. It applies to official Community and Pro registry source, examples that represent supported use, and documentation previews.

A component is not complete because one screenshot looks attractive. It is complete when its hierarchy remains clear, its interaction remains understandable, and its states remain usable across the declared themes, content conditions, input methods, and viewports.

The component's `component.json` narrows this standard into a reviewable contract. Requirements declared there are release requirements, not an aspirational backlog. Preview and stable publication both fail closed when the contract or required evidence is absent. Preview communicates API maturity, not permission to ship unfinished visual, interaction, or accessibility work.

## Product principles

### Quiet by default

- Content and task completion receive more emphasis than component chrome.
- Surfaces, borders, shadows, and color establish one clear hierarchy; they are not stacked for decoration.
- Neutral defaults inherit the host product's character. Functional color is reserved for focus, links, selection, information, warning, success, and failure.
- AI capability is not represented by gradients, glow, glass, novelty motion, or decorative badges.

### Composable without feeling unfinished

- The default composition must be usable without consumer styling.
- Optional slots collapse cleanly; an absent avatar, action group, toolbar, header, or footer must not leave visual gaps.
- Variants represent real product contexts rather than cosmetic duplication.
- Source ownership remains the final customization layer; defaults still have to be coherent before customization.

### State is part of the design

- Empty, loading, streaming, complete, interrupted, failed, disabled, and recovery states receive the same care as the ideal state when applicable.
- Partial output is retained when interruption or failure makes it useful.
- Loading and submission feedback appear promptly without shifting surrounding layout.
- Status is expressed with text or semantics as well as color or motion.

## Visual craft

### Hierarchy

- Every composition has one obvious primary content region and, when present, one obvious primary action.
- Labels, metadata, actions, and helper text remain subordinate to the content they explain.
- Repeated containers are avoided. Use whitespace and alignment before adding another card or divider.
- Related items align to a shared grid and spacing rhythm. Optical alignment may refine mathematical centering for icons and type.
- Long conversations and dense workspaces remain scannable without turning every item into a competing surface.

### Typography

- Installed source inherits the host application's font unless the component contract requires a specialized face such as monospace code.
- Body copy defaults to at least 16px with a readable line height near 1.5. Compact labels remain at least 12px.
- Conversation prose is constrained to a readable measure; code, tables, URLs, and unbroken strings wrap or scroll within their own region.
- Weight, size, and color create hierarchy in that order. Muted text must still meet its required contrast.
- Interface copy is concise, specific, and stable under localization. Placeholder text never acts as the only label.

### Space, shape, and elevation

- Spacing follows the four-pixel foundation rhythm and uses semantic component variables where local control is required.
- Nested elements use equal or tighter radii than their parent. Pills are reserved for tags, compact status, and truly pill-shaped controls.
- Borders or surface contrast provide ordinary separation. Shadows are reserved for overlays and actual elevation.
- Compact density removes excess whitespace, not readable type, focus treatment, or touch safety.
- Component CSS uses semantic tokens. Raw color values and arbitrary z-index values are prohibited.

### Iconography and imagery

- Controls use a consistent SVG icon language. Emoji and text glyphs do not substitute for product icons.
- Icon-only actions have accessible names and at least a 44-by-44 CSS-pixel target on touch layouts.
- Icons support labels; unfamiliar or consequential actions are not icon-only.
- Decorative imagery is omitted when it competes with the task. Meaningful images expose a useful text alternative path.

## Interaction quality

- Interactive elements use semantic HTML and have default, hover where relevant, focus-visible, pressed, disabled, loading, success, and error feedback when applicable.
- The interface never relies on hover to reveal the only path to an action. Hover-disclosed actions remain keyboard reachable and are exposed appropriately for touch.
- Focus order follows visual and task order. Focus is not stolen by streaming content or background updates.
- Async actions prevent accidental duplicate submission while preserving an understandable cancel or recovery path where the operation supports one.
- Destructive or irreversible actions are clearly distinguished and require proportionate confirmation.
- Pointer targets are at least 44 by 44 CSS pixels on touch-capable layouts, with at least 8px separation where adjacent actions could be confused.
- Keyboard shortcuts supplement visible controls and do not override expected text-entry or assistive-technology behavior.

## Responsive quality

Every component declares its required viewports in `component.json`. The default review set is 375, 768, 1024, and 1440 CSS pixels, with additional 320 and 414 checks when a component is likely to appear full-width on mobile.

- Layout is mobile-first and remains useful between named breakpoints, not only at the exact captured widths.
- No page-level horizontal scrolling is caused by the component. Wide code, tables, or tool output scroll inside a labeled, bounded region when wrapping would damage meaning.
- Controls wrap, reflow, or progressively disclose before labels truncate into ambiguity.
- Sticky and floating elements respect safe areas and do not cover focused content, the software keyboard, errors, or the final transcript item.
- The component remains operable at 200% browser zoom and with text-spacing overrides.
- RTL changes direction where meaning is directional while preserving semantic icon meaning.

## Accessibility quality

Official components target WCAG 2.2 AA.

- Prefer native elements and relationships before adding ARIA.
- Every control has an accessible name; visible labels and programmatic labels agree.
- Keyboard behavior, focus entry, focus restoration, and escape behavior are documented when the component manages a composite interaction or overlay.
- Focus indicators are clearly visible against every declared theme and are never removed without a stronger replacement.
- Normal text reaches 4.5:1 contrast and large text reaches 3:1. Controls, meaningful graphics, states, and focus indicators reach 3:1 against adjacent colors.
- Dynamic status is announced at the event level. Streamed tokens are not announced one-by-one.
- Color, position, sound, and motion are never the sole means of conveying state.
- Automated scans are required but do not replace keyboard, screen-reader smoke, zoom/reflow, high-contrast, and touch-target review.

## Motion quality

- Motion communicates entry, exit, relationship, progress, or spatial continuity. Decorative perpetual motion is not allowed in product components.
- Default transitions use transform and opacity, generally last 120–220ms, and remain interruptible.
- Entering elements use ease-out; exits are shorter and use ease-in.
- Layout dimensions and every streamed token are not animated.
- `prefers-reduced-motion: reduce` overrides configured motion and leaves state changes immediately understandable.
- Focus, reading order, hit targets, and announcements never depend on an animation completing.

## Theme and customization quality

- Light, dark, and high-contrast presentations preserve the same information hierarchy.
- Theme changes do not alter component semantics or state behavior.
- Component-local variables use the `--aifk-<component>-*` prefix and fall back to public semantic tokens.
- Supported density, radius, presentation, and motion axes are finite, typed, and documented.
- Custom renderers and slots receive enough context to preserve state and accessibility; consumers are warned when a replacement assumes responsibility for those guarantees.

## Content and resilience

Fixtures use credible interface copy and deterministic data. Required stress cases include applicable combinations of:

- no content and first-use guidance;
- long localized labels and long-form prose;
- unbroken URLs, code, tables, and preformatted output;
- delayed, duplicated, interrupted, failed, and recovered activity;
- unknown or forward-compatible content;
- missing optional media, metadata, actions, and slots;
- large lists or transcripts representative of real use.

The component must fail safely. Error copy explains what happened, whether partial work was retained, and what the user can do next.

## Engineering and performance

- Behavior belongs in primitives or runtime contracts; visual variants do not fork lifecycle semantics.
- Rendering uses stable identities and avoids unnecessary work on streamed updates. Long-list optimization is measured before it is introduced and becomes required when representative fixtures exceed the supported performance budget.
- Components reserve space for predictable async content and avoid layout shift around status, actions, and media.
- Public types are explicit, source is readable after installation, and optional dependencies do not become hidden runtime requirements.
- Official component source never contacts the AIFrontKit platform, performs a runtime license check, or depends on Pro source.

## Documentation and evidence

Every component provides:

- a concise purpose and non-goals;
- anatomy, slots, states, variants, and defaults;
- install and minimal-use instructions;
- customization and token guidance;
- accessibility and keyboard behavior;
- supported compatibility ranges;
- deterministic fixtures for the manifest scenarios;
- evidence for visual, accessibility, interaction, and documentation review.

The documentation preview renders the registry source or its public export. A visually simplified replica cannot be used as release evidence.

## Prohibited shortcuts

A component cannot reach stable maturity with any of the following:

- missing applicable failure, disabled, loading, or recovery states;
- placeholder-only labeling, invisible focus, inaccessible icon controls, or hover-only actions;
- a known contrast, keyboard, screen-reader, reflow, or touch-target failure;
- raw component colors, arbitrary layering, `transition: all`, or unbounded layout animation;
- screenshots that cover only one theme, one viewport, or ideal content;
- non-deterministic fixtures or examples that require a live model service;
- documentation that promises behavior not exercised by a fixture or test;
- an unresolved critical or high-severity review finding.
