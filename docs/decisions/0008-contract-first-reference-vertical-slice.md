# ADR 0008: Stabilize contracts before expanding the component catalog

- Status: accepted
- Date: 2026-08-27

## Context

AIFrontKit already has working packages, source-owned React components, documentation playgrounds, and browser tests. The architecture review found that these surfaces are not yet driven by the same source of truth:

- CLI output directories and generated import aliases are represented by one field;
- the React controlled conversation path creates an internal runtime instead of remaining controlled;
- static CSS tokens and the TypeScript token projection can drift;
- documentation previews, generated code, lab fixtures, and browser tests duplicate scenarios;
- the quality score records the presence of evidence more reliably than its scenario coverage.

Adding more components on top of these boundaries would multiply migrations and visual inconsistency.

## Decision

AIFrontKit will ship one contract-first reference vertical slice before expanding the catalog.

The implementation order is:

1. Separate CLI `output` paths from `imports` aliases and version installed-source provenance.
2. Finalize the framework-neutral ordered message-part and lifecycle contracts.
3. Make controlled React APIs the base layer and provider-backed runtime APIs optional adapters.
4. Generate CSS variables from the TypeScript token contract and add component recipe tokens.
5. Define a serializable example specification that drives controls, preview, code, lab fixtures, interactions, accessibility checks, and screenshots.
6. Polish File, Message, Prompt Input, and Conversation in CSS Modules as the reference components.
7. Add the React Tailwind registry flavor only after the CSS reference passes its quality gates.
8. Require API, scenario, accessibility, interaction, responsive, theme, and screenshot parity before release.

Tool Call remains experimental during the reference pass. Markdown, Image, Attachment, Sources, and Reasoning do not enter the stable catalog until the reference slice is complete.

## Public boundary

```text
framework-neutral contracts (@aifrontkit/core)
                    │
          controlled React primitives
                    │
       optional runtime/provider integration
                    │
       source-owned registry presentation
             ┌──────┴──────┐
       CSS Modules      Tailwind
```

The registry flavors implement the same component contract and version. A styling flavor may change implementation syntax, but it cannot change component props, behavior, accessibility semantics, or documented scenarios.

## Version surfaces

Package versions, schema versions, registry item versions, example-spec versions, and installed provenance versions remain independent. None of them create top-level `v1/`, `v2/`, or `v3.1/` application trees. Version folders are reserved for contracts that genuinely coexist and require migrations.

## Consequences

- Visual polishing is evaluated against real component contexts rather than isolated decorative cards.
- A playground value is the same value rendered in the preview, printed in code, and exercised by tests.
- CSS Modules and Tailwind can be compared mechanically.
- Runtime and adapter integrations cannot become requirements for consumers using controlled components.
- The published quality score must be backed by scenario-addressable evidence, not generic filenames.
