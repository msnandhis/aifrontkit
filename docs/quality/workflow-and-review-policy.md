# Workflow and review policy

## Maturity model

Components move through explicit maturity levels:

```text
experimental -> preview -> stable -> deprecated
```

- **Experimental:** the problem, API, or anatomy is still being tested. It is isolated from production-ready catalogs and is not advertised as production-ready.
- **Preview:** the intended API is usable and documented and the component passes the same visual, interaction, accessibility, fixture, and evidence gates as stable. The API may still evolve with explicit release notes.
- **Stable:** the component satisfies the definition of done, compatibility guarantees, and score threshold.
- **Deprecated:** a supported replacement, migration path, warning, and earliest removal version are published.

Maturity is not inferred from package version. It is declared in `component.json` and changed through review.

### Publication enforcement

- Missing or invalid `component.json`, fixture coverage, quality-gate declarations, or registry-version parity fails publication closed.
- Preview and stable items require at least 90/100, no blocker, complete required evidence, and human review. There is no maintainer override that relabels a failing component as publishable.
- Experimental items are available only through an explicitly experimental catalog, route, or install command. Their documentation and preview carry a persistent **Experimental** label and do not appear in stable/preview recommendations, release counts, or default navigation.
- Promotion changes the manifest, registry metadata/catalog classification, documentation label, baselines, and release notes in one reviewed change. A page title or marketing label cannot promote maturity by itself.
- The current Tool Call item remains experimental. Even when its contract validator passes, it must not be described as preview or stable until it completes the promotion review and the maturity change lands with its evidence.
- Deprecated items retain documentation and installation history, display the replacement prominently, and are excluded from recommendations for new work.

## End-to-end workflow

### 1. Frame the problem

Write the user job, supported context, non-goals, and why an existing primitive, component, pattern, or block does not already solve it. Identify the content and failure cases that could make the design difficult.

Reference products may inform interaction quality, but the proposal must explain the underlying principle rather than copy a branded surface or DOM structure.

### 2. Write the contract

Create or update `component.json` before polishing implementation. Declare:

- purpose, version, and maturity;
- anatomy and extension slots;
- required states and real context variants;
- themes and responsive viewports;
- semantics, keyboard, focus, and motion expectations;
- deterministic fixture scenarios;
- package, schema, registry, React, and platform-independence compatibility.

Review the contract first. This is the cheapest point to remove arbitrary variants, unclear ownership, and missing failure behavior.

### 3. Build fixtures before the final visual pass

Fixtures use fixed identifiers, timestamps, content, and state transitions. They do not use randomness, the current clock, network requests, or model services.

Start with the hardest applicable conditions: empty, streaming, interruption, failure, long content, narrow layout, localization stress, disabled interaction, and missing optional slots. Ideal content alone is not sufficient.

Fixtures are shared by the lab, documentation, interaction tests, accessibility scans, and visual regression. A separate polished mock is not release evidence.

### 4. Implement behavior at the correct layer

Framework-neutral lifecycle and normalization belong in core. React interaction state belongs in headless primitives. Registry source owns visual composition. Adapters translate external protocols. The component does not call an AI service, platform entitlement service, or runtime license endpoint.

Implement semantic structure, reading order, keyboard behavior, focus behavior, status announcements, and error recovery before visual refinement.

### 5. Complete three deliberate polish passes

**Structure pass**

- confirm visual and semantic order;
- remove unnecessary containers and duplicated labels;
- verify content measure, grouping, alignment, and responsive reflow;
- verify optional slots collapse without residue.

**Interaction pass**

- review pointer, touch, and keyboard paths;
- verify focus-visible, pressed, disabled, loading, cancel, failure, and recovery feedback;
- confirm async and streaming updates do not steal focus or force scroll;
- check motion and operating-system reduced motion.

**Resilience pass**

- review all manifest fixtures in light, dark, and high contrast;
- inspect 375, 768, 1024, and 1440 widths plus an in-between width;
- check 200% zoom, RTL, long labels, long output, code, URLs, and absent optional content;
- inspect both an empty/minimal composition and the densest supported composition.

### 6. Run automated gates

Required gates are proportional to the component but never omit contract validation:

- manifest and registry validation;
- type checking and import-boundary checks;
- behavior and interaction tests;
- deterministic compatibility fixtures;
- automated accessibility scan;
- visual regression for the manifest matrix;
- CSS policy and dependency checks;
- documentation examples and links.

The full Cartesian product is not required. Cover each state in the default recipe, then use pairwise theme, viewport, density, motion, and variant coverage. Add explicit cases for structurally unique or historically fragile combinations.

### 7. Conduct human review

The author completes the scorecard with links to evidence. The reviewer then evaluates the component from the fixtures rather than only reviewing source or diffs.

The reviewer asks:

1. Can a new user identify the content, state, and next action without explanation?
2. Is anything visually louder than its importance?
3. Does the component still feel designed in failure, waiting, empty, and dense states?
4. Are actions discoverable with keyboard and touch, not only hover?
5. Does the component feel native to a neutral host product rather than like an AI-themed template?
6. Is every customization axis necessary, typed, and coherent?
7. Would we confidently recommend the default without asking the consumer to restyle it?

A fresh visual reviewer is required for stable promotion when another maintainer is available. If one is not available, record a self-review exception and require fresh review before the next minor release. Authors never approve their own unresolved accessibility exception.

### 8. Release and observe

Update `component.json`, `registry.json`, docs, baselines, and release notes together. Source-owned upgrades describe meaningful DOM, token, accessibility, and behavior changes.

After release, classify feedback as contract gap, implementation defect, documentation gap, or product preference. Product preference does not automatically become a new variant; first prefer tokens, slots, and composition.

## Change review policy

### Contract changes

Changes to anatomy, states, semantics, keyboard behavior, compatibility, default variant, or required slots need component-owner and accessibility review. Breaking source-owned changes include migration guidance.

### Visual changes

Every changed baseline states the user-facing reason. “Updated snapshot” is not an adequate reason. Theme and viewport comparisons must show that hierarchy improved or remained intact.

### Exceptions

An exception is allowed only when all of the following are recorded:

- the exact unmet requirement and affected scenarios;
- why a safe fix cannot ship in the current release;
- severity, user impact, owner, and expiry version/date;
- a usable fallback that avoids a blocking failure;
- approval from the relevant component and accessibility owners.

Critical accessibility, data-loss, security, platform-coupling, and runtime-license violations cannot be excepted into a stable release.

## Review ownership across repositories

- `aifrontkit` owns the standard, manifest contract, Community fixtures, and shared quality tooling.
- `aifrontkit-pro` consumes the same standard and adds premium workspace fixtures; it cannot weaken Community requirements.
- `aifrontkit-platform` presents released source and documentation. It does not redefine component defaults or become a runtime dependency.

The same component version must render from the same released source in the quality lab, documentation, and consumer fixture project.
