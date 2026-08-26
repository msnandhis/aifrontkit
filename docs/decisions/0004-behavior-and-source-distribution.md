# ADR 0004: Distribute behavior as packages and presentation as source

- Status: accepted
- Date: 2026-08-26

## Decision

AIFrontKit has two independent distribution lanes:

1. Versioned npm packages provide framework-neutral models, runtime behavior, React primitives, and optional protocol adapters.
2. The AIFrontKit registry provides editable UI source that is copied into the consumer's application by the AIFrontKit CLI.

Installed UI must never contact AIFrontKit Platform at runtime. OSS packages do not import Pro. Pro source may depend on public packages, but it performs no runtime license checks.

The first-party CLI is the canonical installer. A shadcn-compatible endpoint may be offered as an interoperability layer, but shadcn is not a runtime or authoring dependency.

## Consequences

- Consumers own visual source and can change markup or styles without fighting a package abstraction.
- Behavioral fixes are semantically versioned; copied source records its own provenance and can be diffed before upgrading.
- A component contract is framework-neutral even when its first implementation is React.

