# Multimodal content

## Goal

Multimodal support is a first-class content model, not a collection of attachments bolted onto text messages. Messages and artifacts contain typed content parts rendered through a safe, extensible registry.

## Initial content parts

| Kind | Required concerns |
| --- | --- |
| Text/Markdown | streaming, safe links, code fences, citations, copy |
| Image | dimensions, alt text, loading, zoom, error fallback |
| Audio | duration, transcript/captions, controls, keyboard access |
| Video | poster, captions, controls, responsive sizing |
| File/document | name, type, size, preview/download policy, scan state |
| Code | language, highlighting, copy, diff/version association |
| Structured data | schema label, table/chart renderer opt-in, raw fallback |
| Tool/approval/task | status lifecycle and actions backed by runtime records |

Unknown content parts render a safe diagnostic/fallback rather than crashing a message. Custom renderers register by namespaced type and declare compatible schema ranges.

## Streaming and progressive media

Text can append deltas; structured content and artifacts prefer patches or version replacement. Media may transition through placeholder, metadata-ready, loading, ready, and failed states. Layout reserves known dimensions to avoid jumps.

## Input and attachments

The composer manages selection, local preview, validation, upload progress, cancel, retry, ready, and failure. Customers provide upload and deletion callbacks. Files are never sent to an AIFrontKit service by the OSS runtime.

## Safety and privacy

Renderers treat content and URLs as untrusted. They use allowlisted protocols, sandbox risky previews, sanitize markup, avoid automatic remote-media loading when privacy policy requires consent, and surface file risk states supplied by the customer's backend.

## Accessibility

Every non-text part provides a text alternative path. Time-based media supports captions/transcripts when supplied. Streaming announcements summarize meaningful changes rather than reading every token.

