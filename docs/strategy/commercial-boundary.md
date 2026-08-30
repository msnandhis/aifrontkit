# Community and commercial product boundary

This document is the product boundary for planning and implementation. It is not
legal text. Published licenses, order forms and support terms take precedence
after legal review.

## Boundary rule

Community is a complete foundation for building and operating an accessible AI
frontend. Commercial products sell finished depth, organizational distribution
and accountable support. They do not sell essential correctness fixes or make a
customer application depend on AIFrontKit services at runtime.

| Capability | Community | Pro | Team registry and Studio | Enterprise |
| --- | --- | --- | --- | --- |
| Normalized events, commands and runtime | Complete public contract | Uses the public contract | Uses the public contract | Uses the public contract |
| Primitives and essential components | Public and production-capable | Premium compositions | Curated organization catalog | Governed organization catalog |
| Adapters | Official maintained adapters stay public | Workflow-specific configuration | Approved adapter presets | Validated custom integration help |
| Patterns and templates | Representative end-to-end examples | Finished domain workflows and application shells | Shared private templates | Bespoke governed templates |
| Themes | Neutral accessible themes and tokens | Commercial theme packs | Organization themes and controls | Design-system onboarding |
| Registry and CLI | Anonymous public registry, MCP discovery and local CLI | Protected asset acquisition | Private namespace, version policy and managed updates | Private distribution and audit support |
| Studio | Portable schemas and manual authoring remain public | Personal visual authoring | Collaboration, review and organization controls | SSO, audit and deployment policy |
| Compatibility | Published matrix, migrations and security fixes | Asset compatibility with supported public contracts | Managed upgrade guidance | Negotiated compatibility window |
| Support | Documentation, issue tracker and best effort community help | Product support target | Prioritized team support target | Contractual response and escalation terms |

## Community guarantees

The following capabilities must never require a commercial entitlement:

- event and command schemas, reducer behavior and connection recovery;
- accessibility contracts and fixes for public components;
- official adapter interoperability and compatibility fixtures;
- semantic tokens plus at least one complete light, dark and high-contrast path;
- anonymous installation from the public registry and local source ownership;
- local testing, deterministic fixtures, documentation and upgrade metadata;
- security advisories and fixes for supported public versions.

Community examples must include streaming, tool execution, approval, retry,
attachments and long-running work. A paid example may be more complete or more
specialized, but it cannot be the only explanation of an essential behavior.

## Commercial value

Commercial assets reduce design and integration time. Appropriate paid value
includes:

- production-ready workflows such as research, support operations or code review;
- premium component compositions, application shells and theme packs;
- coordinated private distribution, organization defaults and update policy;
- visual authoring, collaboration, review, audit and procurement capabilities;
- commercial redistribution grants where required by the final license model;
- accountable support, onboarding and negotiated compatibility commitments.

A lawfully acquired source asset remains runnable without an account, telemetry
heartbeat or entitlement request. Entitlements govern acquisition and updates.

## Team registry contract

The team registry is a protected distribution service, not a customer runtime.
It may provide private namespaces, signed manifests, immutable versions, member
access, organization defaults, staged updates and audit records. It must use the
public registry manifest and provenance contracts so downloaded items remain
inspectable and portable.

The public CLI must represent authentication required, access denied, version
incompatible, integrity failure and network unavailable as distinct states. It
must not silently replace a protected item with a public item.

## Support commitments

Before general availability, exact response times and supported-version windows
must be published in customer terms. Until then these labels are product targets:

- **Community:** no response-time guarantee. Stable public releases receive a
  compatibility matrix, migration notes and coordinated security handling.
- **Pro:** documented support channel with a two-business-day initial response
  target for reproducible product issues.
- **Team:** one-business-day initial response target plus guided registry and
  upgrade diagnosis.
- **Enterprise:** contractual severity levels, escalation contacts, response
  targets and a negotiated supported-version window.

Response target does not mean resolution target. Security reporting follows the
security policy rather than a subscription queue. Accessibility and correctness
fixes to Community code are never withheld for a commercial release.

## Decision test for a new capability

Place a capability in Community when removing it would make the public product
unsafe, inaccessible, provider-locked, impossible to recover or unable to build
a representative production workflow. Place it in a commercial product when its
primary value is workflow breadth, visual depth, team coordination, protected
distribution or accountable service.

Reject a boundary that introduces public imports from private repositories,
client-side payment secrets, runtime license checks, invasive telemetry or a
second proprietary event model.
