---
title: Installation
description: Install only the AIFrontKit behavior packages and UI source your application needs.
status: experimental
---

# Installation

Install runtime behavior as npm packages:

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

Visual components are installed as editable registry source rather than opaque
npm packages. Public installation must work without an AIFrontKit account,
license key, platform API, or billing connection.

AIFrontKit currently targets modern ESM projects, React 19, and Node.js 22 or
newer for development tooling. Refer to [compatibility](../reference/compatibility.md)
before adopting a prerelease package.
