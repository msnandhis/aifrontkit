# AIFrontKit

Public, backend-neutral frontend infrastructure for production AI interfaces.

AIFrontKit separates stable behavior from source-owned design:

- npm packages provide a framework-neutral event/runtime core, React primitives, adapters, tokens, and test fixtures;
- the community registry provides editable UI source, patterns, and themes;
- no account, license key, hosted service, or AIFrontKit platform call is required at application runtime.

## Repository map

```text
packages/
  core/               normalized model, event contract, reducer, runtime, schema versions
  react/              providers, hooks, and accessible behavioral primitives
  ai-sdk/             optional Vercel AI SDK event translator
  ag-ui/              optional AG-UI event translator
  tokens/             semantic design-token contract and CSS variables
  testing/            deterministic fixtures and compatibility helpers
registry/
  components/         community source-owned UI
  patterns/           multi-component interaction flows
  themes/             installable theme source
compatibility/        cross-version fixtures
apps/playground/       interactive component and theme verification
docs/                 architecture and product documentation
```

## Dependency contract

```text
external protocol → adapter → @aifrontkit/core → @aifrontkit/react → registry source
```

`core` has no React or DOM dependency. Adapters do not import React. Registry items may use public package exports but packages never import registry source. This repository never imports from `aifrontkit-pro` or `aifrontkit-platform`.

Adapters are optional UI integration helpers, not AI backends. A custom backend can emit the normalized event contract directly and install neither adapter.

## Development

Requires Node.js 22+ and pnpm 10+.

```bash
pnpm install
pnpm check
pnpm --filter @aifrontkit/playground dev
```

`check` runs static type checks, package-boundary validation, tests, and builds. See [architecture](./docs/architecture.md), [versioning](./docs/versioning.md), and [contributing](./CONTRIBUTING.md).

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

## License

Apache-2.0. Registry media or third-party examples may carry their own notices. Commercial assets are not stored here.
