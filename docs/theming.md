# Theming

## Model

Themes are versioned semantic design-token documents compiled to CSS custom properties and framework-neutral metadata. Components consume semantic roles, never hard-coded palette names.

The official default is a polished neutral theme rather than an unstyled baseline or a strongly branded AIFrontKit look. It must be suitable for production immediately and provide clear token paths for warm/cool neutrals, brand accents, density, typography, elevation, and motion.

## APIs

`@aifrontkit/tokens` is framework-neutral. `createTheme(config)` resolves safe defaults, `toCssVariables(theme)` projects serializable CSS custom properties, `getThemeAttributes(theme)` provides scoping attributes, and `checkThemeContrast(theme)` validates the official foreground/background pairs.

React applications can scope a theme through either provider:

```tsx
<AIFrontKitProvider runtime={runtime} theme={{ mode: "dark", density: "compact" }}>
  {children}
</AIFrontKitProvider>
```

```tsx
<ThemeProvider theme={{ temperature: "warm", motion: { level: "none" } }}>
  {children}
</ThemeProvider>
```

Import `@aifrontkit/tokens/css` when using attribute-driven defaults without the React provider. The JavaScript API and CSS file expose the same semantic naming contract.

## Token groups

- Color: canvas, surface, elevated surface, text, muted text, border, accent, status, selection, focus.
- Typography: families, scale, weight, line height, code typography.
- Shape: radii, border widths, control sizes.
- Space and density: spacing scale, content width, compact/comfortable dimensions.
- Elevation: shadows and overlays.
- Motion: level, duration, easing, distance, scale, opacity, stagger, and named recipes with reduced-motion alternatives.
- AI semantics: user/assistant/tool surfaces, reasoning, citation, approval, artifact, composer, streaming indicator.

## Scope and precedence

Themes work at three levels:

1. Global application theme.
2. Subtree/workspace theme provider.
3. Component-level token override.

Precedence is component override → nearest theme scope → global theme → component fallback. Overrides use the same token schema and are inspectable in development.

## Modes

Light, dark, and high-contrast are related modes within one theme family. Theme switching should respect system preference when configured, avoid hydration flashes, and preserve a customer-selected mode.

## Authoring and compatibility

Theme documents declare schema version, supported component contract range, required tokens, optional extensions, and fallback mappings. Missing required tokens fail validation in authoring tools; runtime output retains safe defaults.

## Guardrails

Token customization must not remove focus visibility, make status distinguishable only by color, or violate declared contrast targets. Components may enforce minimum hit targets and layout constraints even when density changes.

Motion overrides must remain interruptible, preserve focus and reading order, avoid per-token animation during streams, and honor user reduced-motion preferences even when a product selects an expressive theme.
