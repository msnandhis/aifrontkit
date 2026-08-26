# Component quality gate

The gate turns the AIFrontKit component definition of done into deterministic,
dependency-free checks. It validates every `registry/components/*/component.json`
contract, its parity with the installable `registry.json`, renderable fixture
modules, review-evidence paths, and component CSS.

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

CSS policy rejects raw hexadecimal colors, numeric z-index values,
`transition: all`, and motion without an effective reduced-motion override.
Registry source must use design tokens and named layer tokens.

The JSON report is stable: component, check, and diagnostic ordering is sorted,
and it deliberately contains no timestamps or machine-specific absolute paths.
