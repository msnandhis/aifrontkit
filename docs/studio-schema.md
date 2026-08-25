# Studio schema

## Purpose

The OSS repository owns the portable document contracts that Studio edits. The private platform owns the hosted editor, persistence, collaboration, billing gates, and Pro assets. This prevents Studio from creating an incompatible proprietary runtime model.

## Documents

- Theme document: tokens, modes, scopes, and component overrides.
- Component configuration: variant axes, slots, capabilities, and renderer references.
- Layout document: constrained tree of workspace zones and breakpoint behavior.
- Experience document: layout plus runtime requirements, installed items, fixtures, and export settings.
- Project document: schema versions and references to the above documents.

## Node model

Layout nodes have stable IDs, registered types, declared slots, allowed child types, constraints, visibility/breakpoint rules, and serializable props drawn from public schemas. They do not contain arbitrary executable JavaScript.

## Authoring metadata

Components may publish labels, groups, icons, control types, valid ranges, defaults, conditional visibility, slot constraints, and preview fixtures. Metadata is descriptive; runtime behavior remains in public packages/source.

## Round-trip and export

Documents must validate and render outside Studio. Unknown safe fields are preserved during round trips. Export produces readable configuration and/or source composition with pinned registry versions. Hosted-only identifiers are optional metadata, not runtime requirements.

## Migration

Every breaking schema revision supplies deterministic migrations and a previewable change report. Studio stores the original version and does not destructively migrate the only copy without history.

## Security

Schemas prohibit scripts, remote code imports, unsafe HTML, and unrestricted URL capabilities. Renderer references resolve only through installed/trusted registry items.

