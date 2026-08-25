# Architecture principles

These are cross-repository constraints. Changing one requires an explicit architecture decision record in the affected repository and review of both repositories.

## 1. Frontend-only product boundary

The OSS product runs in the browser and connects to customer-owned endpoints. Platform backend code exists only to operate AIFrontKit's commercial business: accounts, purchases, licenses, entitlements, hosted registry delivery, and Studio persistence. It must not grow into a general AI backend.

## 2. Framework-agnostic core

Schemas, state transitions, commands, transports, and capability contracts contain no React types, hooks, DOM assumptions, or component imports. React is the first binding. Web Components/vanilla embedding follows after the core stabilizes. Other adapters are demand-led.

## 3. Normalize at the boundary

Customer systems may emit different protocols. Adapters translate them into one versioned AIFrontKit event model. UI components consume normalized state and never parse vendor streams directly.

## 4. Separate behavior from presentation

The runtime and headless primitives own state, accessibility contracts, and actions. Styled source-owned components own markup and visual treatment. This permits stable infrastructure beneath editable customer code.

## 5. One schema, many surfaces

Runtime configuration, component metadata, themes, variants, registry manifests, experience recipes, playground controls, and Studio must use compatible versioned schemas. Studio is an editor for the product model, not a separate page-builder model.

## 6. Progressive ownership

Developers can begin with a complete experience, customize tokens and variants, recompose primitives, or copy component source into their application. No essential Free workflow should depend on a hosted AIFrontKit service.

## 7. Capabilities over monoliths

Feature modules own their contracts, tests, docs, and public entry points. Applications compose capabilities. Cross-feature utilities stay small and neutral; a generic `shared` dumping ground is prohibited.

## 8. Multimodal by model design

Text, images, audio, video, documents, code, structured data, citations, tool states, and artifacts are typed content parts. Accessibility, loading, failure, streaming, and fallback behavior are defined per content kind.

## 9. Explicit public/private boundary

The public repository never imports private code. The private platform may consume released OSS packages and schemas. Commercial registry entries may target public schemas but remain private assets.

## 10. Secure, accessible, performant defaults

Untrusted rich content is sanitized, credentials stay out of browser bundles, keyboard and screen-reader behavior are first-class, and streaming updates avoid unnecessary tree-wide rendering.

## 11. TypeScript source, JavaScript runtime

Both repositories use TypeScript for implementation and publish or execute optimized JavaScript. OSS packages are ESM-first and include `.d.ts` declarations. CommonJS, WebAssembly, and additional implementation languages are introduced only after measured demand or a benchmark-backed architecture decision. Detailed rules and budgets are defined in [Technology and performance strategy](./technology-and-performance.md).
