# aifrontkit

The AIFrontKit CLI installs editable React AI components and exposes read-only registry discovery for developers, automation and MCP hosts.

## Start

```bash
npx aifrontkit init
npx aifrontkit list
npx aifrontkit add conversation
```

The source installer resolves declared dependencies, respects the application's configured import alias and records installed files in `.aifrontkit/installed.json`.

## Review an update

```bash
npx aifrontkit diff conversation
npx aifrontkit add conversation --dry-run
npx aifrontkit add conversation --force
```

Locally edited files are protected unless replacement is explicit. Installation records include registry identity, manifest and source digests, compatibility information and migration history.

## Agent-readable discovery

```bash
npx aifrontkit list --json
npx aifrontkit info tool-approval --json
```

The `aifrontkit/mcp` export exposes read-only registry discovery. The CLI does not execute registry source and it does not require an AIFrontKit account, license key or hosted runtime.

AIFrontKit is prerelease software. See the [repository](https://github.com/msnandhis/aifrontkit) for packages, component documentation, compatibility policy and source.
