# CLI

## Purpose

The CLI initializes AIFrontKit integration, discovers registry content, installs source and dependencies, validates configuration, previews changes, and assists upgrades. Public workflows require no account; protected downloads authenticate with the platform.

## Implemented commands

- `init`: detect project conventions and create a minimal local config.
- `add`: resolve and install an item and its registry dependencies.
- `diff`: compare local source against the configured registry source.
- `doctor`: report the selected target, filesystem output, import alias, and installed provenance.
- `migrate`: explicitly rewrite legacy configuration and provenance to the current schema.
- `list`: discover registry entries with deterministic text or JSON output.
- `info`: inspect one entry and its supported targets.
- `mcp`: expose read-only registry discovery and provenance verification over stdio MCP.
- `provenance-sign`: create a detached Ed25519 registry provenance bundle with a release key.
- `provenance-verify`: verify signatures, manifest digests and source digests against the current registry.

`add` supports `--dry-run` and refuses to overwrite changed source without
`--force`. `--registry=path-or-url` supports local registry work and mirrors.

## Planned command families

- `search`: add faceted compatibility, source and license discovery beyond the current `list` and `info` commands.
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
  "$schema": "https://aifrontkit.dev/schemas/config/v2.json",
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

## MCP discovery

`aifrontkit mcp --registry=path-or-url` starts a read-only stdio MCP server. It exposes `registry_list`, `registry_info` and `registry_verify_provenance`. The server never installs files or executes registry code. Use `--trust-key=public-key.pem --key-id=release-key-id` to require one configured signing identity when agents verify provenance.

The preview CLI ships a bundled Community registry so `list`, `info` and `add`
work without a hosted AIFrontKit service. The custom `--registry` flag remains
available for immutable releases, mirrors and local validation.

The transport uses newline-delimited JSON-RPC and negotiates MCP protocol version `2025-06-18`. The same discovery operations remain exported as TypeScript APIs for hosts that already provide their own MCP transport.

## Registry provenance

Release automation can sign the complete public catalog without storing a key in the repository:

```sh
aifrontkit provenance-sign --registry=. --key=/secure/release-key.pem --key-id=official-2026
aifrontkit provenance-verify --registry=. --trust-key=official-2026.pub.pem --key-id=official-2026
```

The detached `registry/provenance.json` bundle uses Ed25519 signatures. Each signed item binds its manifest digest and a digest over every declared source file. A valid but self-declared signature is reported separately from a signature whose key matches an explicit trust policy.

`provenance-verify` requires a matching `--trust-key` for a successful exit by
default. `--allow-untrusted` is available for inspecting community or development
signatures. Its output still labels the result as untrusted and callers must opt in
explicitly.

## Testing

Use fixture projects for supported package managers and layouts, snapshot operation plans, simulate network/auth failures, and verify idempotent installs, conflicts, path traversal rejection, partial failure recovery, and non-interactive CI behavior.
