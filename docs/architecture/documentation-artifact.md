# Documentation artifact contract

## Purpose

The public documentation is authored in `content/docs`, validated in the OSS
repository, and published as an immutable artifact. The platform consumes that
artifact; it does not read a sibling checkout in production.

## Artifact contents

Every artifact contains:

- all public Markdown/MDX pages for one product release;
- `navigation.json`, including the ordered public information architecture;
- `versions.json`, including the current documentation channel and route policy;
- a generated `artifact.json` containing the source commit, release version,
  package versions, schema major, registry format version, build timestamp, and
  integrity hashes;
- referenced public static assets and deterministic example identifiers.

The release pipeline must reject uncommitted content, broken internal links,
missing navigation entries, duplicate routes, unsupported frontmatter status,
and a version manifest that disagrees with the release channel.

## Version and route policy

Active source stays on one mainline. Do not copy the source tree into `v1`, `v2`,
or `v3.1` directories. A Git tag produces an immutable documentation artifact.
The platform maps the current major to `/docs` and maintained older majors to
`/docs/v{major}`. Patch and minor releases update the artifact behind their major
route while exact provenance remains available in `artifact.json`.

Search, previous/next navigation, code samples, API links, and component previews
must resolve inside the selected major. Cross-major links must be explicit.

## Trust boundary

The OSS artifact contains public product information only. Pro documentation is
published independently as a private artifact and joined by the platform after
server-side entitlement checks. Neither artifact may contain credentials,
entitlement policy, billing implementation, or platform operational details.

## Consumer contract

The platform may style and render the content, but it must preserve page IDs,
routes, release provenance, code semantics, and accessibility. A failed or
incompatible artifact import fails the platform build instead of silently
publishing partial documentation.
