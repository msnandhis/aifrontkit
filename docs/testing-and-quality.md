# Testing and quality

The current schema-v1 fixture in `compatibility/fixtures/schema-v1` is executed by the core test suite. A supported fixture therefore cannot silently drift away from the current reducer contract.

The repeatable component-review standard, scorecard, release evidence, and human-review policy live in [`quality/`](./quality/README.md). Each registry component declares its required states, viewports, themes, fixtures, compatibility, and quality gates in `component.json`; publication validation fails closed when that contract is absent or drifts from `registry.json`.

## Local gates

```bash
pnpm check
pnpm quality:browser
```

`check` includes component-contract validation and its validator tests. `quality:browser` builds and opens renderable fixtures using the real registry source in the Component Lab, then verifies semantic anatomy, declared states, automated WCAG scans, 375px containment, RTL, reduced motion, coarse-pointer targets, and reviewed light/dark/high-contrast screenshots. The browser gate is also required in CI and keeps its report and failure evidence as artifacts.

## Test pyramid

- **Schema:** fixtures, parser diagnostics, migrations, fuzz/property checks.
- **Core:** deterministic reducer, command/effect, replay, reconnect, cancellation, selector, and serialization tests.
- **Adapters:** recorded protocol fixtures and conformance tests.
- **Primitives/components:** behavior, keyboard, accessibility, slot, controlled/uncontrolled, and error tests.
- **Visual:** theme, variant, state, viewport, RTL, and high-contrast regression.
- **Experience:** end-to-end deterministic scenario tests.
- **CLI/registry:** fixture-project install, diff, conflict, integrity, auth error, and path safety tests.

## Contract test kit

A reusable conformance package lets framework bindings, transports, adapters, and renderers demonstrate required behavior. Passing conformance is necessary but not sufficient for official support; documentation and maintenance ownership are also required.

## Quality gates

Type checking, linting, unit/integration tests, schema compatibility, accessibility scans, visual baselines, bundle budgets, dependency/security review, documentation links/examples, and license metadata must pass before release.

## Combination strategy

The complete Cartesian product of component × variant × framework × adapter × theme × viewport is not sustainable. Tests are layered:

- behavior contracts run once against shared primitives/runtime;
- every supported adapter runs the same normalized conformance scenarios;
- each component state is tested in the default visual recipe;
- pairwise coverage exercises supported variant, theme, density, motion, and viewport combinations;
- high-risk or structurally unique combinations receive explicit visual and accessibility cases;
- complete experiences cover representative integration paths.

Variants may not fork behavior simply to satisfy visual design. If a variant requires a different lifecycle, that difference becomes a named capability with its own contract.

## Fixtures over live services

Most tests and examples run without network or model APIs. Normalized fixture streams include ordering faults, duplicates, slow chunks, cancellation, reconnect, partial artifacts, expired approval, upload failure, unknown content, and future schema versions.

## Manual release review

Critical flows receive keyboard/screen-reader checks, mobile review, theme contrast review, upgrade/diff verification, and install in a clean consumer project. A capability without failure states and docs is not complete.

Run `pnpm lab:dev` for the human review workbench. Preview and stable components require at least 90/100, no blocking failures, passing automated evidence, and explicit human approval. Experimental components remain visibly isolated and cannot be presented as release-ready evidence.
