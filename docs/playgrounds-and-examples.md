# Playgrounds and examples

## Run the component playground

```bash
pnpm install
pnpm --filter @aifrontkit/playground dev
```

The initial playground is fully local and deterministic. It exercises the Message component across complete, streaming, and failed states, with live controls for light/dark/high-contrast mode, neutral/warm/cool temperature, density, radius, motion, and presentation variant.

## Three surfaces

1. **Component playground:** isolated states, themes, variants, viewport, motion, and accessibility inspection.
2. **Experience playground:** complete deterministic conversations and workspaces using fixtures.
3. **Integration examples:** small applications showing customer transports/adapters without becoming production backends.

## Fixture system

Fixtures use normalized events and a controllable clock. Scenarios include first load, long thread, token stream, reconnect, tool/approval lifecycles, failed attachment, progressive artifact, empty states, RTL, long localization strings, reduced motion, and small screens.

No example requires a real model or paid API key for its primary learning path. Optional live examples isolate user-supplied endpoints and never proxy credentials through an AIFrontKit service.

## Controls

Playgrounds expose documented theme tokens, variant axes, component states, capability toggles, and viewport—not arbitrary internal props. A scenario can be shared through a serializable versioned configuration that contains no secrets.

## Relationship to docs and Studio

Docs embed the same fixtures and renderers used in tests. Studio previews consume the same schemas but add authoring controls. Playground remains public and local-capable; it is not a reduced marketing demo for Studio.

## Quality use

Each significant registry item has at least one canonical scenario and failure scenario. Visual snapshots, accessibility checks, performance measurements, and manual review operate against these deterministic routes.
