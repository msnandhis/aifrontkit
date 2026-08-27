# ADR 0009: Resolve registry source through a target-aware catalog

- Status: accepted
- Date: 2026-08-27

## Context

AIFrontKit distributes editable presentation source for more than one framework and styling flavor. A component name alone is therefore not a unique install identity, and deriving a manifest path from a folder convention cannot represent patterns, future layouts, or components that exist in only one flavor.

## Decision

The canonical install identity is `(framework, flavor, name)`. `registry/registry.json` lists each public name once and advertises only the targets that actually exist, with an explicit manifest path for each target. The CLI resolves that catalog before reading an item or its dependencies.

Dependencies must exist in the same target. There is no cross-flavor fallback. Installed provenance records the resolved manifest path and target. Changing a project's selected flavor does not silently replace previously installed source; a future explicit style migration will own that operation.

The AIFrontKit catalog has its own versioned schema. A separate generated endpoint may provide shadcn-compatible interoperability without constraining the canonical catalog.

## Consequences

- CSS Modules can remain physically stored under `registry/react/css` without making that path public API.
- Tailwind File can mature as an unadvertised candidate while other Tailwind
  components remain unavailable; a target is added only after full parity evidence.
- Blocks and patterns resolve their declared paths correctly.
- Missing targets produce deterministic availability errors rather than raw filesystem or HTTP failures.
- Registry validation can prove catalog-to-manifest agreement and same-target dependency closure.
