# CLI

## Purpose

The CLI initializes AIFrontKit integration, discovers registry content, installs source and dependencies, validates configuration, previews changes, and assists upgrades. Public workflows require no account; protected downloads authenticate with the platform.

## Implemented commands

- `init`: detect project conventions and create a minimal local config.
- `add`: resolve and install an item and its registry dependencies.
- `diff`: compare local source against the configured registry source.
- `doctor`: report the selected framework, style, alias target, and installed provenance.

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

`aifrontkit.json` records the registry source, React/CSS flavor, and component alias.
`.aifrontkit/installed.json` separately records item versions, source paths, target
paths, timestamps, and content hashes. Secrets never live in either file.

## Extensibility

Additional registries are configured by URL and trust policy. Command plugins are deferred until a secure, necessary use case exists; registry item types and adapters provide most ecosystem extensibility without executing third-party CLI code.

## Testing

Use fixture projects for supported package managers and layouts, snapshot operation plans, simulate network/auth failures, and verify idempotent installs, conflicts, path traversal rejection, partial failure recovery, and non-interactive CI behavior.
