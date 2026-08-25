# Codebase structure

The implemented public repository is package-oriented, with feature-oriented internals.

```text
aifrontkit/
├── packages/
│   ├── core/src/{model,events,runtime,schema,migrations}
│   ├── react/src/{runtime,message,composer,tool}
│   ├── ai-sdk/
│   ├── ag-ui/
│   ├── tokens/
│   └── testing/
├── registry/{components,patterns,themes}
├── compatibility/fixtures/
├── scripts/
└── docs/
```

Packages exist for independent runtime, dependency, publishing, or public-API boundaries—not for file count. Inside a package, each feature owns its components, hooks, types, tests, and entry point. Low-level core domains use direct folders without a redundant `features/` level.

Controlled subpath exports expose feature APIs. Imports into another package's `src` or `internal` folders are invalid. A shared module is created only after two real consumers exist.

Future docs and playground apps belong in `apps/` once they have executable value. Future packages such as Markdown must earn a distinct dependency and release boundary.
