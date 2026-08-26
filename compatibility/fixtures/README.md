# Framework compatibility fixtures

These are real build targets, not documentation snippets. CI compiles the React/Vite app and production-builds both Next.js router modes against the canonical React/CSS registry source.

- `react-vite`: React client application and CSS Modules.
- `next-app-router`: server page composing a client registry component.
- `next-pages-router`: Pages Router build proving component-local CSS Modules do not violate Next.js global CSS rules.

Web Components and Angular will receive independent fixtures when their contract implementations begin. They must not wrap or import React as the product boundary.
