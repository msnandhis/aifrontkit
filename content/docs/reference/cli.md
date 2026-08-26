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
```

The project configuration is intentionally small:

```json
{
  "$schema": "https://aifrontkit.dev/schemas/config.json",
  "framework": "react",
  "style": "css",
  "aliases": { "aifrontkit": "@/components/aifrontkit" }
}
```

`add` resolves registry dependencies, refuses to overwrite modified files unless
`--force` is explicit, and writes `.aifrontkit/installed.json`. Provenance records
the registry item version, original source path, installed path, timestamp, and
SHA-256 content hash. `diff` compares current local source with its registry source.

Use `--dry-run`, `--cwd=path`, and `--registry=path-or-url` in automation and local
registry development.

