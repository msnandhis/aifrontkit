# Documentation tooling

`validate-docs.mjs` checks the public documentation publication boundary without
requiring the website application. It validates navigation and version metadata,
required page frontmatter, relative Markdown links, unique page ownership, and
the single-mainline version policy.

The platform must run the same validation before importing an immutable docs
artifact. Rendering, search indexing, and API extraction may be added here when
the corresponding public contracts exist.
