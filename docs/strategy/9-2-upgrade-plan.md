# 9.2 product and architecture upgrade

## Target position

AIFrontKit is backend-neutral frontend infrastructure for production AI
interfaces. Its defensible layer is the combination of a canonical interaction
contract, accessible behavior primitives, source-owned production patterns,
adapter compatibility fixtures and agent-readable distribution.

## Upgrade map

| Dimension | Current batch | Evidence | Next gate |
| --- | --- | --- | --- |
| Architecture | Separate confirmed events from user-intent commands. Add first-class tasks and steps. Keep adapters outside React. | Core reducer, command transport and schemas | Connection/reconnect state and structured diagnostics |
| Differentiation | Model long-running agent work and consequential approval as reusable behavior, not chat-only visuals. | Task and approval primitives plus agent-progress pattern | Research, artifact review and resumable checkpoint patterns |
| Maintainability | Emit one v3 part-addressed model from AI SDK and AG-UI adapters. | Adapter fixtures and boundary checks | Generated compatibility matrix against pinned upstream fixtures |
| Developer experience | Add controlled and runtime-bound primitive modes. Add JSON registry discovery. | `aifrontkit list/info --json` | MCP server wrapper and framework adapter examples |
| Product quality | Preserve text, reasoning, source, file, data, tool, approval, error, task and step states. | Unit, component, browser and accessibility suites | Visual and browser fixtures for installable blocks |
| Monetization readiness | Keep OSS contracts and runtime complete while allowing premium source patterns to use the same manifests. | No platform dependency in public packages or registry blocks | Signed remote manifests, namespaces and entitlement-compatible index metadata |
| Defensibility | Make adapter behavior, event replay and UX states testable as a coherent compatibility layer. | Deterministic reducer and adversarial tests | Public conformance kit and third-party adapter certification |

## Scope boundaries

This repository does not execute agents, models or tools. It does not own
authentication, persistence, billing or uploads. Those remain application and
platform concerns connected through public adapters and callbacks.

## Prioritized batches

1. Finish event and command conformance with connection lifecycle, structured
   validation diagnostics and malformed/reordered fixture coverage.
2. Add production registry blocks for research progress, artifact review,
   attachment upload recovery and checkpoint resume.
3. Ship an MCP wrapper over the stable registry discovery API and publish
   shadcn-compatible namespace instructions.
4. Add pinned upstream AI SDK and AG-UI fixture matrices plus LangGraph and
   external-store reference adapters.
5. Add signed manifest verification, deprecation metadata and security advisory
   output to the CLI.
