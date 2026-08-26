# ADR 0006: Compound components with progressive disclosure

- Status: accepted
- Date: 2026-08-26

## Decision

Every UI capability offers three layers when the use case warrants them:

1. A polished default component for the common path.
2. Named props for controlled variations such as size, variant, density, motion, and renderer injection.
3. Compound parts for full composition without forking behavior.

The normalized content model and accessibility behavior live below presentation. Renderer callbacks receive typed context rather than undocumented internal state.

`File` is the reference implementation. `MessagePrimitive.Parts` is the reference renderer-injection boundary. `Conversation` supports both controlled messages and provider-backed runtime state using the same normalized `Message` type.

## Consequences

- Defaults are useful without boilerplate.
- Advanced consumers can reorder or replace parts while retaining semantics.
- New framework implementations target the contract, not React component internals.

