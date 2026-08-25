# Releases and compatibility

## Version surfaces

Package versions, schema versions, registry item versions, and documentation versions are distinct and recorded explicitly. Semantic versioning applies to public package APIs. Schema and registry compatibility use declared ranges.

## Compatibility policy

- Additive optional schema changes remain compatible when semantics do not change.
- Breaking schema changes require a new version and migrations.
- Framework bindings declare supported core ranges.
- Registry items declare package, schema, and peer dependency ranges.
- Platform/Studio records supported public schema ranges independently.

## Release groups

Tightly coupled packages may release as a coordinated group, while adapters, themes, and registry items can release independently. A changeset records user-visible change, affected surfaces, migration, source-owned upgrade notes, and security/accessibility impact.

## Source-owned components

Registry item updates are immutable versions. The CLI compares provenance and local changes, shows upstream diffs, and never promises automatic merge success. Critical fixes include a concise patch guide for heavily customized copies.

## Deprecation

Deprecations include replacement, warning mechanism, earliest removal version, and migration path. Security revocation is exceptional and does not erase published history. Maintained major-version windows are published once releases begin.

## Pre-1.0 discipline

Pre-1.0 does not mean arbitrary breakage. Experimental APIs are labeled; stable capability contracts receive migrations and changelog notes. Schema stability is prioritized because both repositories and customer source depend on it.

