# Roadmap

The roadmap prioritizes a coherent frontend foundation before breadth. Dates are intentionally omitted until staffing and validation are known.

## Phase 0 — Contracts and proof

- Finalize event, content-part, theme, registry, and experience schemas.
- Prototype a framework-neutral runtime with deterministic transition tests.
- Validate one customer-defined transport and one external adapter.
- Prove React bindings, source-installed UI, and an isolated playground.
- Establish the pinned bundle/performance harness and validate the initial core, React, conversation UI, latency, streaming, and 1,000-message budgets.
- Obtain legal guidance on OSS/commercial licensing.

**Exit:** a streamed multimodal conversation with stop, retry, tool state, approval, and artifact updates works without vendor-specific code in components.

## Phase 1 — OSS foundation

- Publish schema, core, React, UI, themes, registry client, CLI, and initial adapters.
- Cover essential conversation, composer, sources, attachments, reasoning, tools, approvals, tasks, and artifacts.
- Establish the polished neutral visual baseline, light/dark/high-contrast modes, semantic motion controls, and the first purpose-designed variants.
- Ship accessibility, security, performance, and testing baselines.
- Launch public docs, examples, component playgrounds, and at least two complete experiences.

**Exit:** a team can build and brand a production-quality React AI interface using only public assets.

## Phase 2 — Distribution and ecosystem

- Stabilize registry contribution/review workflows and compatibility metadata.
- Expand patterns, blocks, multimodal renderers, workspaces, and adapter examples.
- Add upgrade/diff workflows for source-owned components.
- Publish structured agent-readable manifests, installation contracts, examples, anti-patterns, and an `llms.txt` surface before evaluating MCP distribution.
- Define plugin contracts only where real extension use cases justify them.

**Exit:** source ownership remains maintainable across upgrades and third parties can publish compatible content safely.

## Phase 3 — Commercial platform

- Implement one web application for marketing, authentication, account, billing, licenses, teams, and downloads.
- Add server-side entitlement evaluation and protected registry delivery.
- Launch Studio against the same public schemas with export-first workflows.
- Add organization administration, auditability, and support operations.

**Exit:** purchase-to-download and Studio-to-export journeys are secure, observable, and supportable.

## Phase 4 — Broader frontend reach

- Ship Web Components/vanilla embedding after the core and React APIs stabilize.
- Evaluate Vue, Svelte, and Angular adapters based on demand and maintainer capacity.
- Add enterprise and OEM capabilities without introducing a separate product core.

## Explicitly deferred

- AI inference, model gateway, RAG, agent orchestration, and tool execution.
- Multiple backend language SDKs unless repeated demand justifies maintenance.
- Free-form Webflow-style canvas editing; Studio begins with constrained structural composition.
- Separate website/dashboard/account apps before organizational or scaling evidence requires them.
