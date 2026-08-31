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

The adapter release matrix currently verifies AI SDK 6 and 7, AG-UI core from
the reviewed `0.0.50` floor through `0.0.59` and LangGraph from the reviewed
`1.0.0` floor through `1.4.13`. Exact package installations run in temporary
projects, assert the expected public runtime exports and are then removed. The
upstream packages do not become dependencies of the structural adapters.

Tracked current and maintained-major pins are checked against explicit npm
dist-tags each week. Minimum support pins stay fixed until a deliberate support
policy change. Fixture projection tests and exact package probes must both pass
before the matrix is updated.

Documentation is released from the same tagged source and records exact provenance.
The current major is available at `/docs`; maintained older majors may be served at
`/docs/v{major}` from tagged or release-branch artifacts. Source code itself does
not use parallel `v1/`, `v2/`, or `v3/` parent trees. Breaking changes require a
migration path and preserved older documentation while that major remains supported.
