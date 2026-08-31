# Framework compatibility fixtures

These are real build targets, not documentation snippets. CI compiles every fixture and runs deterministic output checks where a framework produces a browser bundle.

- `react-vite`: React client application and CSS Modules.
- `next-app-router`: server page composing a client registry component.
- `next-pages-router`: Pages Router build proving component-local CSS Modules do not violate Next.js global CSS rules.
- `react-router-spa`: lazy route consuming `@aifrontkit/react` through a provider-neutral event transport boundary.
- `astro-react-island`: static Astro page hydrating an AIFrontKit agent surface as an isolated React island.

The React Router and Astro fixtures consume public workspace packages rather than importing registry source. They prove that application routing and island hydration stay outside the runtime contract. Both examples use deterministic local events and require no backend, provider credential or model call.

Web Components and Angular will receive independent fixtures when their contract implementations begin. They must not wrap or import React as the product boundary.
