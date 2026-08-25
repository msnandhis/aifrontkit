# Versioning and compatibility

## Stable repository root

Do not create parent source trees such as `v1/`, `v2/`, or `v3.1/`. The repository root represents the current mainline. Git tags (`@aifrontkit/core@1.2.0`), npm releases, and Changesets preserve product history without duplicating the codebase.

## Independent version surfaces

- npm packages use Semantic Versioning and may release independently;
- normalized schema contracts use explicit major directories such as `schemas/v1`;
- registry items have immutable SemVer releases and declare compatible package/schema ranges;
- documentation is versioned at release/deployment time rather than copied manually in source;
- the platform records the exact OSS contract and registry versions it supports.

Minor versions such as `1.2.0` add compatible capability. `2.0.0` may break a public contract and requires migration tooling. A later `3.1.0` is simply a SemVer release in the same repository, not a `v3.1/` parent folder.

## When version folders are correct

Version folders are allowed only when multiple contracts must coexist:

```text
packages/core/schemas/v1/
packages/core/schemas/v2/
packages/core/src/migrations/v1-to-v2.ts
compatibility/fixtures/schema-v1/
compatibility/fixtures/schema-v2/
```

Old implementation copies, React components, and whole applications must not be preserved this way. Maintained old majors use release branches with backported security fixes.

## Compatibility gates

Every adapter fixture declares protocol/source version. Every registry manifest declares its own version, schema major, and `@aifrontkit/*` ranges. CI verifies old supported fixtures against the current reducer and verifies migrations before a major schema is released.
