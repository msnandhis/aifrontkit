# Security

## Threat model

The browser renders untrusted model output, user content, files, URLs, tool metadata, registry source, and potentially third-party renderer output. The OSS runtime also handles customer-supplied auth context and endpoint access.

## Required controls

- Sanitize Markdown/HTML with explicit allowlists; never render raw model HTML by default.
- Validate URL schemes and isolate generated HTML/app previews in a restrictive sandbox.
- Keep provider keys and long-lived platform/customer secrets out of browser bundles.
- Redact credentials, transcript content, and file data from diagnostics by default.
- Validate event size, nesting, discriminators, and schema version before reduction.
- Bound streaming buffers, attachments, retries, and renderer resource consumption.
- Treat filenames, code language labels, citations, and tool names as untrusted display text.
- Require explicit callbacks and confirmation UI for consequential actions.

## Registry and CLI supply chain

Manifests use integrity checks, immutable versions, safe paths, dependency review, and clear publisher/license identity. CLI installs never execute arbitrary item scripts. Security advisories can deprecate/revoke an item while retaining an auditable record.

## Extension isolation

Custom renderers execute with application privileges unless customers isolate them; documentation makes this explicit. Preview renderers use sandboxed origins/capabilities. Plugin APIs avoid ambient access and accept explicit context.

## Vulnerability process

Publish a private reporting channel, supported-version policy, severity/response targets, coordinated disclosure guidance, and advisory process. Security fixes receive upgrade notes for both packages and source-owned registry items.

## Boundary reminder

AIFrontKit provides UI for auth context, uploads, approvals, and tool execution status. It does not authenticate the customer's users, scan files, authorize tools, or execute actions; customer systems remain authoritative.

