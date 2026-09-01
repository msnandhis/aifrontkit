# AIFrontKit

Public, backend-neutral frontend infrastructure for production AI interfaces.

AIFrontKit separates stable behavior from source-owned design:

- four npm packages provide the CLI, framework-neutral core, React primitives and optional adapters;
- the community registry provides editable UI source, patterns, and themes;
- no account, license key, hosted service, or AIFrontKit platform call is required at application runtime.

Component documentation includes typed playgrounds where labelled controls,
the real registry preview, shareable state, and complete generated code stay
synchronized.

## Repository map

```text
packages/
  core/               normalized contracts, runtime, schemas and test helpers
  react/              providers, primitives, semantic themes and CSS variables
  adapters/           AI SDK, AG-UI, LangGraph and external-store boundaries
  cli/                source installer, aliases, provenance, and diffs
registry/
  react/css/          default React implementation with CSS Modules
  react/tailwind/     parity-verified Tailwind components and patterns
  themes/             installable theme source
contracts/ui/         framework-neutral component contracts
compatibility/        cross-version fixtures
apps/playground/       routed docs, MDX, search, and typed component playgrounds
apps/lab/              internal component quality and stress-test workbench
docs/                 architecture and product documentation
```

## Dependency contract

```text
external protocol → adapter → @aifrontkit/core → @aifrontkit/react → registry source
```

`core` has no React or DOM dependency. Adapters do not import React. Registry items may use public package exports but packages never import registry source. This repository never imports from `aifrontkit-pro` or `aifrontkit-platform`.

Adapters are optional UI integration helpers, not AI backends. A custom backend can emit the normalized event contract directly and install neither adapter.

## Development

Requires Node.js 22+ and pnpm 11.19+.

```bash
pnpm install
pnpm check
pnpm quality:browser
pnpm docs:browser
pnpm lab:dev
pnpm --filter @aifrontkit/playground dev
```

`check` runs package and installable-registry type checks, package-boundary validation, unit tests, component-contract validation, documentation validation, and builds. `quality:browser` runs the component browser and visual gates; `docs:browser` covers routes, MDX, search, themes, component previews, mobile navigation, and accessibility. See [architecture](./docs/architecture.md), [component quality](./docs/quality/README.md), [versioning](./docs/versioning.md), and [contributing](./CONTRIBUTING.md).

## Configurable visual foundation

```tsx
<AIFrontKitProvider
  runtime={runtime}
  theme={{
    mode: "dark",
    temperature: "neutral",
    density: "comfortable",
    radius: "medium",
    motion: { level: "subtle" }
  }}
>
  <Message messageId="assistant-42" variant="conversation" />
</AIFrontKitProvider>
```

The provider projects framework-neutral semantic tokens onto one scoped root. Registry components consume those tokens and remain editable source. Users can also use `ThemeProvider`, `createTheme`, or raw CSS variables independently.

## Distribution

Behavior packages are published under `@aifrontkit/*`. Visual UI is installed from the public registry as polished, neutral source with configurable tokens, variants, composition, and motion. Packages and registry items version independently and declare compatibility ranges.

```bash
npx aifrontkit init
npx aifrontkit add conversation
npx aifrontkit list --json
```

The first-party installer is independent of shadcn. It resolves registry dependencies, respects the project's alias, protects locally edited files, and records provenance for reviewable upgrades.

## License

Apache-2.0. Registry media or third-party examples may carry their own notices. Commercial assets are not stored here.
