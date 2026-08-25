# Interaction patterns

## Purpose

Patterns encode proven multi-component AI UX behavior. They are more valuable than visual fragments because they document states, transitions, accessibility, error recovery, and responsive behavior.

## Initial catalog

- Send, stream, stop, retry, and reconnect.
- Edit a user message and branch a conversation.
- Regenerate and compare alternatives.
- Progressive reasoning disclosure without exposing unsupported hidden data.
- Tool progress with pending, running, completed, failed, and cancelled states.
- Approval before a consequential action, including reject and expiry.
- Progressive research with search activity, sources, citations, and synthesis.
- Attachment selection, validation, upload, removal, and failure recovery.
- Artifact handoff from conversation to workspace pane.
- Task plan/progress, checkpoint, interruption, resume, and clarification.
- File change and diff review with explicit accept/reject callbacks.

## Pattern specification

Each pattern document/manifest includes intent, prerequisites, actors, trigger, state diagram, component roles, runtime events/commands, keyboard and screen-reader behavior, mobile adaptation, empty/loading/error states, analytics hooks, security risks, and prohibited uses.

## Composition

Patterns use public primitives and runtime capabilities. They do not import a complete experience or private platform service. When two patterns overlap, shared behavior is extracted into a primitive/runtime capability only if it is stable and reusable.

## Trust and consequential actions

Approval patterns state what will happen, target, scope, reversibility, and requester. UI never presents a customer callback as completed until a confirming event arrives. Destructive actions require distinct visual and accessible treatment.

## Evaluation

Pattern quality is tested with deterministic scenarios including slow streams, reordered events, offline/reconnect, permission denial, partial tool results, long content, keyboard-only use, reduced motion, and narrow screens.

