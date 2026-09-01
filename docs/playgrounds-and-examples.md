# Playgrounds and examples

## Run the component playground

```bash
pnpm install
pnpm --filter @aifrontkit/playground dev
```

The documentation playground is fully local and deterministic. It currently covers Conversation, Message, Prompt Input, File, and experimental Tool Call with scenario, content, slot, lifecycle, theme, viewport, direction, motion, framework, and language controls appropriate to each component.

## Three surfaces

1. **Component playground:** isolated states, themes, variants, viewport, motion, and accessibility inspection.
2. **Experience playground:** complete deterministic conversations and workspaces using fixtures.
3. **Integration examples:** small applications showing customer transports/adapters without becoming production backends.

## Canonical example specifications

Each documented example is a versioned, serializable specification. The specification owns its initial values, controls, scenarios, expected events, viewport/theme matrix, and assertions. Framework adapters provide rendering and code generation without creating a second catalog.

```text
example specification
├── documentation controls and preview
├── copyable code
├── component lab fixture
├── interaction assertions
├── accessibility scan
└── visual baseline coordinates
```

Component props and environment settings are separate axes. Theme, styling flavor, framework, language, viewport, direction, and motion preferences describe the environment; they never masquerade as component props in generated code.

Changing a value must update the rendered preview and generated code from the same normalized state. A normal control change must not remount the component or discard focus, draft input, scroll position, or local interaction state. Scenario identity changes may request an explicit reset when the scenario requires it.

The framework-neutral contract lives in `@aifrontkit/core/testing`. React definitions live beside their registry components rather than inside an app. File is the first completed reference at `registry/react/css/components/file/file.example.tsx`: the documentation app and Component Lab import that definition directly, while the registry payload still installs only the component and its stylesheet.

## Fixture system

Fixtures use normalized events and a controllable clock. Scenarios include first load, long thread, token stream, reconnect, tool/approval lifecycles, failed attachment, progressive artifact, empty states, RTL, long localization strings, reduced motion, and small screens.

No example requires a real model or paid API key for its primary learning path. Optional live examples isolate user-supplied endpoints and never proxy credentials through an AIFrontKit service.

## Controls

Playgrounds expose documented theme tokens, variant axes, component states, capability toggles, and viewport—not arbitrary internal props. A scenario can be shared through a serializable versioned configuration that contains no secrets.

## Relationship to docs and Studio

Docs, the component lab, and tests consume the same example specifications and renderer adapters. Studio previews consume the same schemas but add authoring controls. Playground remains public and local-capable; it is not a reduced marketing demo for Studio.

## Quality use

Each stable registry item has a recommended scenario, failure scenario, long-content scenario, narrow viewport, light/dark/high-contrast coverage, keyboard path, and reduced-motion path. Evidence records the component, example-spec version, scenario, styling flavor, theme, viewport, and browser project. Release checks fail when required coordinates are missing.

## Buildable framework consumers

Framework integration claims are exercised by production builds in `compatibility/fixtures`:

- React with Vite verifies direct registry consumption.
- Next.js verifies both App Router and Pages Router rendering constraints.
- React Router verifies a lazy application route and a provider-neutral event transport feeding the canonical runtime.
- Astro verifies a static page with a hydrated React island consuming the public core and React packages.

These fixtures intentionally stop at the frontend boundary. Hosts own routing, transport lifecycle, credentials and backend execution while AIFrontKit receives canonical events.
