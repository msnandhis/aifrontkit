---
title: CLI
description: Configure aliases, install source, inspect provenance, and review registry updates.
status: experimental
---

# CLI

The first-party `aifrontkit` CLI manages source-owned UI without requiring shadcn.

```bash
npx aifrontkit init
npx aifrontkit add file
npx aifrontkit diff file
npx aifrontkit doctor
npx aifrontkit migrate
npx aifrontkit list --json
npx aifrontkit info agent-progress --json
```

The project configuration is intentionally small:

```json
{
  "$schema": "https://aifrontkit.dev/schemas/config.json",
  "schemaVersion": 2,
  "target": { "framework": "react", "flavor": "css-modules" },
  "output": { "components": "src/components/aifrontkit" },
  "imports": { "components": "@/components/aifrontkit" }
}
```

`add` resolves registry dependencies, refuses to overwrite modified files unless
`--force` is explicit, and writes `.aifrontkit/installed.json`. Provenance records
immutable manifest and source digests, item and schema versions, compatibility,
resolved target paths, timestamps, installed files, and migration history. `diff`
compares current local source with its registry source.

The catalog resolves the exact `(framework, flavor, name)` target and records its
real manifest path. It never guesses folders or falls back across styling
flavors. Tailwind File is currently an internal parity candidate, not an
advertised install target. Components remain CSS Modules-only until their full
parity evidence is complete. Switching the
configured flavor cannot overwrite an item installed for another flavor.

Use `--dry-run`, `--cwd=path`, and `--registry=path-or-url` in automation and local
registry development.

`list` and `info` provide stable JSON output for agents, MCP bridges and registry
automation. Search with `--query=approval` without scraping the documentation UI.
