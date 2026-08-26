---
title: Documentation source
description: Authoring boundary for AIFrontKit's public product documentation.
status: internal
---

# Public documentation source

This directory is the canonical source for documentation published on the
AIFrontKit website. It contains user-facing guidance only; repository strategy,
private platform operations, and internal engineering policy remain in `docs`.

- `navigation.json` defines the ordered public information architecture.
- `versions.json` defines documentation channels and routes.
- `_templates/component-page.md` defines the required capability-page shape.
- Every publishable Markdown page requires `title`, `description`, and `status`
  frontmatter.

Run `pnpm docs:validate` before publishing. Versioned copies are produced from
Git tags as immutable artifacts, never maintained as duplicate source folders.
