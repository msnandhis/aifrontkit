# Licensing model

This document defines product strategy, not final legal text. Counsel should approve exact licenses, compatibility claims, terms, and enforcement before launch.

## Goals

- Make evaluation, learning, community contribution, and genuinely open-source use straightforward.
- Fund long-term maintenance through commercial use, Pro content, Studio, teams, enterprise, and OEM use.
- Keep one technical foundation rather than degrading Free with an incompatible runtime.
- Clearly distinguish source license, content license, hosted-service terms, and account entitlements.

## Proposed model

### Open-source use

Core packages and the public registry are available under an approved open-source license. If a reciprocal license such as GPLv3 is chosen, compatible open-source applications may use the covered code under those terms.

### Commercial application license

Proprietary applications purchase an appropriate commercial grant when the selected source license requires it or when they use commercial assets. Likely tiers are Individual, Team, and Organization, with limits expressed in legal terms rather than fragile client-side checks.

### Pro content and Studio

Pro components, blocks, experiences, themes, and Studio features are proprietary. Access is controlled by entitlements, but downloaded source remains governed by the purchased license. Studio should export portable output and should not make ordinary application runtime dependent on subscription availability.

### OEM / builder license

A separate negotiated license is required when a customer redistributes AIFrontKit in an SDK, template marketplace, website/app builder, low-code platform, hosted generator, or product that enables downstream users to create or receive copies.

### Enterprise

Enterprise agreements may add SSO, audit records, procurement terms, private distribution, support, indemnity, and negotiated deployment rights. They should not fork the core architecture.

## Free and paid boundary

Free includes a usable core runtime, essential primitives/components, public themes, adapters, CLI, documentation, and representative experiences. Paid value comes from breadth and acceleration: premium assets, advanced Studio workflows, collaboration, organization controls, commercial grants, protected delivery, and support.

The operational edition matrix, Community guarantees and support targets are
defined in [Community and commercial product boundary](./commercial-boundary.md).
That boundary must remain valid regardless of the exact licenses approved by
legal counsel.

## Enforcement principles

- Never place payment secrets or authoritative entitlement logic in the OSS client.
- The CLI may authenticate for protected downloads, but public operations work anonymously.
- The platform evaluates entitlements server-side and issues short-lived scoped download authorization.
- License verification should fail clearly and support legitimate offline development where the contract allows it.
- Avoid invasive telemetry or remote kill switches in customer applications.

## Decisions still requiring legal review

1. Exact OSS license per package and registry asset category.
2. Whether copyleft and commercial dual licensing meets adoption goals.
3. Contributor license agreement or developer certificate of origin.
4. Definitions of developer, organization, project, redistribution, and generated copy.
5. Treatment of modified copied source and post-subscription rights.
