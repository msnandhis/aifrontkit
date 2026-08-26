# ADR 0005: Use source-owned, token-driven styling

- Status: accepted
- Date: 2026-08-26

## Decision

The default React registry uses CSS Modules and semantic AIFrontKit tokens. It requires no utility framework. Components expose stable `data-slot`, `data-state`, `data-role`, `data-variant`, and `data-size` hooks and accept `className` at every public composition boundary.

Neutral light and dark themes are the baseline. Brand color is an opt-in accent. Motion is intentional, bounded by component contracts, and disabled by `prefers-reduced-motion`.

## Why CSS Modules

CSS Modules work in Vite, Next.js App Router, and Next.js Pages Router without importing component-global styles from arbitrary modules. Source ownership keeps the result editable, while modules prevent accidental style leakage.

## Consequences

- Tailwind is an optional future registry flavor, not a prerequisite.
- Applications customize through tokens, composition, props, and stable data hooks before resorting to selectors tied to internal markup.
- Every registry flavor must satisfy the same framework-neutral component contract.

