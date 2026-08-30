# Schemas and event model

## Responsibility

The schema capability is the stable language between transports, runtime, components, registry items, playground fixtures, and Studio. It models frontend interaction—not provider payloads or backend execution.

## Core entities

- `Thread`, `Participant`, and ordered `Message` records.
- Typed `ContentPart` values for multimodal content.
- `ToolCall`, `Approval`, `Task`, `Artifact`, `Attachment`, `Citation`, and `Error` records.
- `AIEvent` union for incremental state changes.
- `UICommand` union for user intent such as send, stop, retry, approve, reject, edit, branch, select artifact, or dismiss error.

Every entity has a stable opaque ID, timestamps where ordering matters, optional metadata with bounded serializable values, and an explicit status union. States must be representable without relying on a component being mounted.

## Event families

| Family | Typical lifecycle |
| --- | --- |
| Message | created → content delta/replace → completed/failed |
| Reasoning | started → delta → completed/hidden |
| Tool | requested → awaiting approval/running → result/failed/cancelled |
| Artifact | created → patched/versioned → completed/failed |
| Task | created → progress/status changes → completed/failed |
| Attachment | selected → validating/uploading → ready/failed/removed |
| Connection | connecting → open/reconnecting → closed/failed |

Schema v2 introduced explicit message part IDs. Schema v3 adds task lifecycle events without changing the published v2 contract.
Schema v1 and v2 remain readable through the migration boundary. New adapters emit v3.

## Command families

Commands are versioned separately from events and represent user intent:
`message.send`, `message.retry`, `task.stop`, `task.resume`,
`approval.resolve`, `attachment.remove`, and `error.dismiss`. The core package
validates and transports commands but does not execute their effects.

Events carry monotonically useful sequence information or a deterministic tie-breaker. Reducers must tolerate duplicated events and explicitly report unknown entity references. Reconnect behavior may replay events without corrupting state.

## Versioning

Schemas use a declared version independent of package version. Additive optional fields are preferred. Renames or semantic changes require a new schema version and migration. Parsers preserve unknown safe metadata but reject unknown event discriminators unless an adapter intentionally handles them.

## Validation

- Validate adapter output and registry/Studio documents at development and service boundaries.
- Provide compact production validators for untrusted network input.
- Return structured diagnostics containing path, code, expected version, and recovery guidance.
- Maintain golden fixtures for valid, malformed, partial, duplicate, reordered, and future-version input.

## Exclusions

Schemas do not define model provider requests, prompts, tokens, agent plans, server database records, billing usage, or authentication protocols. A UI may display cost or agent state supplied as typed metadata, but AIFrontKit does not calculate or execute it.
