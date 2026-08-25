# CLI

## Purpose

The CLI initializes AIFrontKit integration, discovers registry content, installs source and dependencies, validates configuration, previews changes, and assists upgrades. Public workflows require no account; protected downloads authenticate with the platform.

## Planned command families

- `init`: detect project conventions and create a minimal local config.
- `search` / `info`: inspect catalog metadata, compatibility, source, and license.
- `add`: resolve and install an item and its registry dependencies.
- `diff` / `upgrade`: compare local source against a newer registry version.
- `remove`: remove only safely attributable files/dependencies, with preview.
- `validate` / `doctor`: check schemas, package ranges, paths, aliases, and environment.
- `theme`: validate/compile theme documents.
- `experience`: validate/export an experience document.
- `login` / `logout`: optional device/browser authentication for Pro registry access.

`studio` may open local or hosted Studio integration later, but Studio remains a platform capability rather than embedding a second schema engine in the CLI.

## Safety

All mutations support dry-run and print an operation plan. Existing changed files are never overwritten without an explicit conflict workflow. The CLI writes only within validated project paths, avoids arbitrary install hooks, redacts credentials, and returns meaningful non-zero exit codes for automation.

## Configuration

A versioned project config records registry sources, aliases/target directories, styling strategy, framework adapter, package manager preference, schema version, and installed provenance. Secrets never live in this file.

## Extensibility

Additional registries are configured by URL and trust policy. Command plugins are deferred until a secure, necessary use case exists; registry item types and adapters provide most ecosystem extensibility without executing third-party CLI code.

## Testing

Use fixture projects for supported package managers and layouts, snapshot operation plans, simulate network/auth failures, and verify idempotent installs, conflicts, path traversal rejection, partial failure recovery, and non-interactive CI behavior.

