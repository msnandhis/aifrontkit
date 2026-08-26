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
external-consumer builds and deterministic event fixtures. The repository currently
production-builds React/Vite, Next.js App Router, and Next.js Pages Router fixtures.

Documentation is released from the same tagged source and records exact provenance.
The current major is available at `/docs`; maintained older majors may be served at
`/docs/v{major}` from tagged or release-branch artifacts. Source code itself does
not use parallel `v1/`, `v2/`, or `v3/` parent trees. Breaking changes require a
migration path and preserved older documentation while that major remains supported.
