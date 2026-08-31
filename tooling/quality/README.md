# Component quality gate

The gate turns the AIFrontKit component definition of done into deterministic,
dependency-free checks. It validates every `registry/react/css/components/*/component.json`
contract, its parity with the installable `registry.json`, renderable fixture
modules, review-evidence paths and component CSS. The same command also checks
every official `registry/react/css/patterns/*` directory against
`pattern-quality.json`.

Run it from the OSS repository root:

```sh
node tooling/quality/component-quality.mjs
node tooling/quality/component-quality.mjs --json
node --test tooling/quality/component-quality.test.mjs
```

The default contract threshold is 90/100, but any failed check still fails the
component. Scores measure whether required proof is connected; actual release
approval also requires the referenced browser/accessibility evidence and human
review. A boolean declaration or scenario-name catalog alone cannot pass.

Pattern contracts are centralized because installable blocks span multiple
component primitives. Every pattern directory must have a manifest entry. Each
entry must match its real `*QualityScenarios` fixture and connect accessibility,
interaction and documentation evidence. Visual regression evidence is
enforceable when declared and must identify both its test source and every
committed snapshot. Missing implementation, style, fixture, evidence or snapshot
files fail the release command.

CSS policy rejects raw hexadecimal colors, numeric z-index values,
`transition: all`, and motion without an effective reduced-motion override.
Registry source must use design tokens and named layer tokens.

The JSON report is stable: component, check, and diagnostic ordering is sorted,
and it deliberately contains no timestamps or machine-specific absolute paths.
