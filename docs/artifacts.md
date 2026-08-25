# Artifacts

## Definition

An artifact is a persistent, inspectable output that deserves a surface separate from the transcript: code, document, spreadsheet, image, HTML preview, diff, file collection, or structured result.

## Data model

An artifact has ID, type, title, status, current version, ordered versions, content/patch metadata, provenance, optional associated message/tool/task, capabilities, and presentation hints. Large binary content is referenced by customer-owned URLs or handles, not duplicated into runtime state.

## Lifecycle

```text
created → streaming/updating → ready
                     ├──────→ failed
ready → new version → ready
```

Patches include base-version information. Conflicts produce an explicit recoverable state rather than silently applying to the wrong version.

## Viewer contract

Artifact viewers define supported types, read/edit capability, toolbar actions, loading/empty/error states, safe rendering policy, and responsive behavior. Built-in viewers can cover code, Markdown/document, image, diff, data table, and sandboxed HTML preview. Editor, terminal, browser, and spreadsheet integrations are hosts/adapters, not mandatory core dependencies.

## Workspace behavior

Artifacts can open in a right pane, bottom pane, overlay, tab, or full-screen route depending on workspace recipe and breakpoint. Selection is URL-addressable where practical. Closing a pane does not delete the artifact.

## Source and security

HTML and generated apps render in an isolated sandbox with restricted capabilities and explicit origin policy. File downloads require clear user action. Source maps, credentials, host filesystem access, and arbitrary script bridges are prohibited by default.

## Non-goals

AIFrontKit does not compile user applications on servers, run terminals, save documents to a database, or provide collaborative editing. Customers integrate those systems through viewer/editor contracts.

