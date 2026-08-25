# Documentation system

## Information architecture

- **Start:** installation, first transport, first component, first experience.
- **Concepts:** event model, runtime, composition, source ownership, multimodal, theming.
- **Capabilities:** one page per primitive/component/pattern with complete state coverage.
- **Integrations:** transports, adapters, frontend frameworks, and minimal endpoint examples.
- **Reference:** schemas, packages, configuration, CLI, registry manifest, compatibility.
- **Guides:** branding, accessibility, security, performance, migration, testing, Studio export.

## Single-source rules

Package API reference derives from source types and annotations. Registry item pages derive metadata from manifests. Interactive examples reference named playground fixtures. Concept docs explain rationale and link to reference; they do not duplicate every option.

## Capability page template

Every capability page includes purpose, when to use/avoid, anatomy, runtime requirements, installation, minimal example, states, variants, tokens, composition/slots, actions/events, accessibility, responsive behavior, security notes, testing guidance, and compatibility.

## Versioning

Docs clearly identify current, prerelease, and maintained older versions. Code snippets and registry examples are tested against their declared package version. Broken links, stale symbols, invalid manifests, and inaccessible examples fail CI.

## Discoverability

Terminology matches the shared glossary. Navigation follows the product hierarchy: primitive → component → pattern → block → experience. Search indexes concepts, API symbols, CLI commands, registry IDs, and common problem language.

## Public boundary

OSS docs explain integration with commercial registry and Studio through public contracts but do not contain platform operational secrets. Commercial documentation can link back to canonical OSS concepts.

