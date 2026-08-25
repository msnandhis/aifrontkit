# Transports and adapters

## Separation

A **transport** moves commands and raw events between browser and customer endpoint. An **adapter** translates an external protocol into AIFrontKit events or implements the transport contract for a known ecosystem. Keeping them separate prevents vendor details from leaking into core or UI.

Both are optional integration helpers for UI data. They do not call models, execute agents or tools, store conversations, or turn AIFrontKit into a backend. A customer endpoint that already emits normalized AIFrontKit events needs no ecosystem adapter.

## Transport contract

A transport accepts connection context, sends semantic commands, emits raw or normalized events, reports connection state, supports cancellation, and disposes resources. Authentication headers/tokens are supplied by the customer at call time and must not be retained longer than necessary.

Initial transports may include custom callback, fetch/SSE, and test/in-memory implementations. WebSocket is added when bidirectional/reconnect needs are demonstrated. Every transport documents ordering, retry, resume, abort, and credential behavior.

## Adapter strategy

- Start with a generic custom adapter and the most demanded existing frontend protocol.
- Keep adapters small: mapping, validation, capability negotiation, and diagnostics.
- Never reproduce model orchestration or provider SDK behavior.
- Publish external protocol compatibility ranges and fixture-based conformance tests.

Potential integrations include Vercel AI SDK, AG-UI, OpenAI Responses streams, and custom JSON/SSE. Inclusion is roadmap-driven, not a promise to support every backend framework.

## Customer integration levels

1. **Custom transport:** customer maps an existing API with a few callbacks.
2. **Known adapter:** AIFrontKit translates a supported protocol.
3. **Reference endpoint example:** docs show minimal server response formatting without creating a maintained backend SDK.

## Failure behavior

Parse failures identify the adapter, event type, schema version, and recoverability. Reconnection resumes from a cursor when supported; otherwise it reports that replay or refresh is required. Raw payload logging is opt-in and redacted by default.

## Security boundary

No provider API key belongs in browser configuration or examples. Cross-origin, cookie, token refresh, and upload rules remain customer-owned. The transport offers hooks; it does not become an authentication system.
