---
title: Install with the CLI
description: Initialize AIFrontKit, add source components, and review local changes safely.
status: experimental
---

# Install with the CLI

The AIFrontKit CLI copies editable React and CSS Module source into your project.
It is independent of shadcn and does not require an account or platform request.

## Initialize a project

Run from the application root:

```bash
npx aifrontkit init
```

This creates `aifrontkit.json`:

```json
{
  "$schema": "https://aifrontkit.dev/schemas/config.json",
  "framework": "react",
  "style": "css",
  "aliases": {
    "aifrontkit": "@/components/aifrontkit"
  }
}
```

The alias must resolve to a directory inside the project. Change it before adding
components when your application uses a different source layout.

## Add components

```bash
npx aifrontkit add file
npx aifrontkit add conversation
```

`conversation` installs its registry dependencies—Message, File, and Prompt
Input—in the same directory. Install the package dependencies printed by the CLI.

Every installed file is recorded in `.aifrontkit/installed.json` with its source,
component version, timestamp, and SHA-256 hash. Commit that file with your source.

## Review and update

```bash
npx aifrontkit diff conversation
npx aifrontkit add conversation --dry-run
npx aifrontkit add conversation --force
npx aifrontkit doctor
```

`diff` reports `current`, `modified`, or `missing`. `add` refuses to overwrite
local changes unless `--force` is explicit. Review the diff in version control
before forcing an update.

Use `--cwd=path` for another project root and `--registry=path-or-url` for a local
or private registry. See the full [CLI reference](../reference/cli.md).
