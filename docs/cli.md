# CLI

## Purpose

The CLI initializes AIFrontKit integration, discovers registry content, installs source and dependencies, validates configuration, previews changes, and assists upgrades. Public workflows require no account; protected downloads authenticate with the platform.

## Implemented commands

- `init`: detect project conventions and create a minimal local config.
- `add`: resolve and install an item and its registry dependencies.
- `diff`: compare local source against the configured registry source.
- `doctor`: report the selected target, filesystem output, import alias, and installed provenance.
- `migrate`: explicitly rewrite legacy configuration and provenance to the current schema.

`add` supports `--dry-run` and refuses to overwrite changed source without
`--force`. `--registry=path-or-url` supports local registry work and mirrors.

## Planned command families

- `search` / `info`: inspect catalog metadata, compatibility, source, and license.
- `upgrade`: apply a reviewed diff with migration metadata.
- `remove`: remove only safely attributable files/dependencies, with preview.
- `validate` / `doctor`: check schemas, package ranges, paths, aliases, and environment.
- `theme`: validate/compile theme documents.
- `experience`: validate/export an experience document.
- `login` / `logout`: optional device/browser authentication for Pro registry access.

`studio` may open local or hosted Studio integration later, but Studio remains a platform capability rather than embedding a second schema engine in the CLI.

## Safety

All mutations support dry-run and print an operation plan. Existing changed files are never overwritten without an explicit conflict workflow. The CLI writes only within validated project paths, avoids arbitrary install hooks, redacts credentials, and returns meaningful non-zero exit codes for automation.

## Configuration

`aifrontkit.json` keeps filesystem destinations separate from generated import
specifiers. A TypeScript alias is never treated as a directory:

```json
{
  "$schema": "https://aifrontkit.dev/schemas/config.json",
  "schemaVersion": 2,
  "target": {
    "framework": "react",
    "flavor": "css-modules"
  },
  "output": {
    "components": "src/components/aifrontkit"
  },
  "imports": {
    "components": "@/components/aifrontkit"
  }
}
```

`output.components` is a validated project-relative path. `imports.components`
is the specifier used in generated examples and dependency imports.

`target.framework`, `target.flavor`, and the requested item name select one exact
catalog target. The catalog—not a hard-coded folder convention—provides its
manifest. File is currently an internal Tailwind candidate, not an advertised
target; Tailwind installs therefore fail with a clear availability message until
its complete parity matrix passes. Dependencies never cross
from one styling flavor into another.

`.aifrontkit/installed.json` separately records immutable registry and source
digests, item and schema versions, compatibility ranges, resolved target paths,
timestamps, and migration history. Secrets never live in either file. Legacy
configuration remains readable, but is only rewritten by `aifrontkit migrate`.
Changing `target.flavor` does not overwrite source installed for the previous
flavor. Use a separate output until an explicit style-migration command ships.

## Extensibility

Additional registries are configured by URL and trust policy. Command plugins are deferred until a secure, necessary use case exists; registry item types and adapters provide most ecosystem extensibility without executing third-party CLI code.

## Testing

Use fixture projects for supported package managers and layouts, snapshot operation plans, simulate network/auth failures, and verify idempotent installs, conflicts, path traversal rejection, partial failure recovery, and non-interactive CI behavior.
