---
title: Installation
description: Install only the AIFrontKit behavior packages and UI source your application needs.
status: experimental
---

# Installation

AIFrontKit uses two distribution lanes: versioned npm packages for behavior and
editable registry source for visual components. Most React applications use both.

Initialize the source installer:

```bash
npx aifrontkit init
npx aifrontkit add conversation
```

`init` creates `aifrontkit.json`. By default, editable source is written to
`src/components/aifrontkit` and generated examples import it through
`@/components/aifrontkit`. `add conversation` also installs declared registry
dependencies such as Message, File, and Prompt Input and records exact file
hashes in `.aifrontkit/installed.json`.

Install runtime behavior as npm packages when your application uses provider-backed
streaming state:

```bash
pnpm add @aifrontkit/core @aifrontkit/react
```

Add `@aifrontkit/tokens` when you want the default semantic token contract. Add
an integration package only when your backend uses that protocol:

```bash
pnpm add @aifrontkit/ai-sdk
# or
pnpm add @aifrontkit/ag-ui
```

Visual components are editable registry source rather than opaque npm components.
The AIFrontKit CLI is the canonical installer; it does not require shadcn. Public
installation works without an AIFrontKit account, license key, platform API, or
billing connection.

Continue with [CLI installation](cli.md), or use the supported
[manual source flow](manual-installation.md). Then choose the framework guide:

- [React](react.md)
- [React with Vite](vite.md)
- [Next.js App Router](next-app-router.md)
- [Next.js Pages Router](next-pages-router.md)

Review local changes before updating copied source:

```bash
npx aifrontkit diff conversation
npx aifrontkit add conversation --dry-run
npx aifrontkit add conversation --force
```

AIFrontKit currently targets modern ESM projects, React 18.3–19, and Node.js 22
or newer for development tooling. Refer to [compatibility](../reference/compatibility.md)
before adopting a prerelease package.
