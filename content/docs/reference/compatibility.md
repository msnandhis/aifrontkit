---
title: Compatibility
description: Read the prerelease compatibility policy for packages, schemas, registry source, and documentation.
status: experimental
---

# Compatibility

AIFrontKit is prerelease. Current workspace package versions are development
versions and are not a promise of v1 stability. Adopt exact prerelease versions,
review release notes, and run consumer fixtures during upgrades.

Compatibility is expressed across package SemVer, schema major, registry format,
React peer range, and registry-item versions. A supported combination must pass
external-consumer builds and deterministic event fixtures.

Documentation is released from the same tagged source and records exact
provenance. The current major is available at `/docs`; maintained older majors use
`/docs/v{major}`. Breaking changes require a migration path and preserved older
documentation while that major remains supported.
