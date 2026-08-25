# End-to-end OSS architecture

## System shape

```text
External backend/API
       │ raw events and commands
       ▼
Transport + protocol adapter
       │ normalized AIFrontKit events
       ▼
Framework-neutral client runtime
       │ snapshots, selectors, commands
       ├──────────────┐
       ▼              ▼
Framework binding   Studio/registry schemas
       │
       ▼
Primitives → source-owned components → blocks → experiences
```

## Layers

### Contract layer

Versioned schemas define identifiers, content parts, events, commands, runtime configuration, themes, variants, registry manifests, and experience documents. Runtime validation is optional in production builds but required at untrusted boundaries and in development tooling.

### Runtime layer

A deterministic store reduces normalized events into conversation, message, stream, tool, approval, artifact, attachment, task, and error state. Commands express user intent; transports perform external I/O. Framework bindings subscribe through selectors.

### Interface layer

Headless primitives bind runtime state and accessible actions to UI semantics. Styled components are distributed mainly as editable source. Blocks and experiences compose them without bypassing runtime contracts.

### Distribution layer

The registry describes packages, files, dependencies, compatibility, license category, and Studio metadata. The CLI validates projects and installs public or entitled content. Public docs and playgrounds render registry examples against deterministic fixtures.

## Dependency rules

- Schemas depend on no other AIFrontKit package.
- Core depends only on schemas and neutral utilities.
- Transports/adapters depend on schemas/core contracts, never React or UI.
- Framework bindings depend on core; headless React primitives may depend on React binding utilities.
- Styled UI may depend on public primitives and tokens, not on platform services.
- Registry tooling may inspect every public layer but runtime packages never depend on the registry.
- Apps compose packages and features; packages do not import from apps.

## Extension points

Supported extension points are transports, adapters, content renderers, tool renderers, artifact renderers, theme contracts, registry item types, and experience slots. Extensions declare supported schema/API ranges and fail with observable diagnostics when incompatible.

## Data ownership

The runtime holds ephemeral client state. Customer callbacks own durable thread persistence, authentication context, upload storage, and tool execution. No OSS package silently uploads transcripts or requires AIFrontKit cloud services.

## Architectural rejection criteria

Reject a proposal if it embeds provider parsing in components, couples core to React, executes customer tools or models, makes a paid service necessary for Free runtime use, introduces parallel schemas for Studio, or allows private code to become an OSS build dependency.

