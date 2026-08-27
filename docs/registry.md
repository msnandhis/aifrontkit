# Registry

## Purpose

The registry is the catalog and distribution contract for source components,
patterns, blocks, experiences, and themes. Framework-neutral behavior remains in
npm packages. The public registry is OSS; the private platform can serve Pro
entries using the same public manifest schema.

The canonical install identity is `(framework, flavor, name)`. The catalog lists
each public name once and declares an explicit manifest path for every available
target. Physical folders such as `registry/react/css` are implementation details,
not paths the CLI guesses. Framework-neutral UI contracts live under
`contracts/ui`; every implementation declares which contract version it satisfies.

## Item manifest

Every item declares a stable namespaced ID, type, version, description, license category, schema/API compatibility, files, package dependencies, registry dependencies, install targets, integrity hashes, documentation URL, preview fixtures, Studio metadata, and optional migration references.

Registry dependencies form an acyclic graph within the same framework and styling
flavor. There is no cross-flavor fallback. Install paths are logical until the CLI
maps them through explicit filesystem output configuration. Manifests cannot write
outside approved project roots or run arbitrary post-install scripts.

## Item categories

- Package references and adapters.
- Source-owned primitives/components.
- Patterns and blocks.
- Workspaces and experiences.
- Theme families and token presets.
- Example fixtures and optional Studio metadata.

## Public and commercial delivery

Public index and items work anonymously and can be mirrored. Commercial items use the same manifest structure but are indexed/delivered by the platform after entitlement checks. The OSS client must distinguish unavailable, unauthenticated, forbidden, incompatible, and network-failed states.

## Integrity and provenance

Signed or hash-verified manifests bind item versions to file contents. Installed
provenance records the exact target and resolved manifest path for diff-based
upgrades. Switching flavor never silently replaces installed source.

## Publishing workflow

Validate schema → resolve dependencies → build previews → run tests/security scans → review documentation/license → create immutable version → publish index entry. Published versions are immutable; corrections produce a new version or explicit revocation advisory.

## Ecosystem safety

Community namespaces prevent impersonation. Registry UI clearly separates official, verified, and community content. Content policy, reporting, deprecation, and security-advisory processes are required before broad third-party publishing.
