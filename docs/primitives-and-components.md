# Primitives and components

## Two-layer model

Headless primitives provide accessible structure, runtime bindings, state attributes, actions, and slot contracts. Styled components provide opinionated production UI and are usually copied into the customer's codebase through the registry. Package-based primitives can evolve beneath locally owned visual source.

“Opinionated” means visually finished but brand-neutral: strong typography, spacing, hierarchy, responsive layout, complete interaction states, and restrained motion. Official components must not require customers to design the basic product before they can ship.

## Capability families

### Conversation

Thread, message list, message, composer, prompt input, attachments, mentions, slash commands, model selector, suggestions, branch navigation, edit, retry, regenerate, stop, copy, feedback, citation, and source.

### Agent interaction

Reasoning, tool invocation/result, approval, permission, task plan/progress, agent status, handoff, checkpoint, clarification, and error recovery. These render supplied state; they do not execute agents or tools.

### Workspace

Thread navigation, artifact panel, source panel, file tree, editor host, preview host, terminal-output view, task panel, responsive panes, and command surfaces.

## Component contract

Every component defines purpose, required runtime capability, slots, variants, states, events/actions, keyboard behavior, accessibility semantics, tokens, motion recipes, responsive behavior, and failure/empty/loading/interrupted states. Public APIs favor semantic names over DOM-shaped props.

## Composition rules

- Compound components expose replaceable slots without requiring a monolithic `<AIChat>`.
- Convenience components may assemble defaults but must permit slot overrides or decomposition.
- Components read state through narrow selectors.
- Presentational components may accept controlled data for documentation and testing.
- Runtime actions remain injectable so source-owned UI is testable independently.

## Source ownership

Visual files installed by CLI belong to the customer. Registry metadata records their origin and version so upgrades can show diffs without overwriting local changes. Essential logic is not hidden in generated minified code.

## Definition of done

A component is complete only with docs, fixtures for significant states, automated accessibility checks, keyboard tests, visual regression coverage, theme/variant examples, responsive verification, and registry metadata.
