# Framework adapters

## Strategy

The core is framework-neutral TypeScript that publishes optimized ESM JavaScript and declarations. React is first because it offers the fastest path to validate API design and target initial users. Web Components/vanilla embedding follows after core contracts stabilize. Vue, Svelte, Angular, and other bindings are demand-led.

## React binding

The React package provides a runtime provider, selector hooks, command hooks, context boundaries, error handling, and headless primitives. It uses concurrency-safe external-store subscription patterns, avoids mirroring runtime state into component-local state, and supports controlled/test modes.

## Web Components and vanilla

The later web package offers custom elements for simple embedding and an imperative mount API for legacy/CMS use. It shares core and theme schemas. DOM events and properties map to normalized commands/configuration; complex data uses properties rather than oversized HTML attributes.

Encapsulation is evaluated carefully: Shadow DOM improves isolation but can complicate design-system integration. The chosen strategy must preserve theming, accessibility, server rendering expectations, and escape hatches.

## Adapter parity

Framework bindings target behavioral parity, not identical syntax. A shared conformance suite verifies event reduction, commands, lifecycle cleanup, capability visibility, and accessible semantics. Framework idioms are allowed at the binding surface.

## Release policy

Core/schema compatibility ranges are explicit. React can mature before later adapters. A new adapter is accepted only with committed maintainers, documentation, conformance coverage, and a sustainable release path.

## Non-goals

No Python, Go, Java, or .NET UI SDKs are needed for browser interoperability. Server framework examples may emit compatible events, but they are not framework adapters in this repository. CommonJS compatibility and WebAssembly are not initial adapter goals; both require demonstrated need under the shared [technology and performance strategy](./strategy/technology-and-performance.md).
