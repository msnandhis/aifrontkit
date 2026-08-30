# Developer validation and adoption measurement

Architecture quality becomes product evidence only when developers can install,
understand and recover the product without maintainer intervention. This protocol
defines the preview cohort, success criteria and privacy boundary.

## Preview cohort

Recruit 8 to 12 frontend developers across these segments:

- at least two building their first AI interface;
- at least three with an existing AI SDK, AG-UI or custom stream integration;
- at least two maintaining a production AI interface;
- coverage across Vite, Next.js App Router and Next.js Pages Router.

Participants use a clean project and the published preview package. Maintainers
may observe but do not provide help until the participant asks. Record requested
help as part of the result.

## Required tasks

1. Choose an integration and render a streaming conversation.
2. Apply a theme change without breaking documented contrast requirements.
3. Render one tool call and one approval decision.
4. Recover from an offline transition or retryable stream failure.
5. Locate the task progress pattern and adapt it to a long-running operation.
6. Explain which files the project owns and which package APIs remain external.

## Preview decision gates

| Measure | Preview target | Action when missed |
| --- | ---: | --- |
| Clean installation completion | at least 90% | Fix installer or package metadata before adding features |
| First working streaming UI within 15 minutes | at least 80% | Simplify quickstart and defaults |
| Correct adapter chosen without maintainer help | at least 80% | Rewrite integration decision path |
| Retry or offline recovery completed | at least 80% | Improve primitive API and recovery example |
| Approval workflow completed accessibly | at least 80% | Fix pattern semantics and documentation |
| Source ownership correctly explained | at least 80% | Clarify package versus copied-source boundaries |
| Participants who would adopt for a new project | at least 60% | Interview non-adopters before expanding catalog breadth |

Any data loss, credential exposure, inaccessible blocking action or undocumented
runtime service dependency blocks release regardless of aggregate scores.

## Collection contract

Primary validation is a moderated task study. The aggregate export contract at
`contracts/adoption/adoption-summary.schema.json` provides an optional way to
combine results across a consenting cohort. It intentionally contains only
counts, coarse duration buckets and fixed categories.

The contract prohibits participant, account, device and project identifiers. It
has no fields for prompts, messages, files, source code, URLs, IP addresses or
free-form notes. Raw observation notes remain outside product telemetry and must
follow the research consent and retention policy.

Collection rules:

- off by default and enabled only through explicit informed consent;
- no SDK or package performs network transmission;
- export is a deliberate local action with a preview before sharing;
- counts are reported only for a cohort, never as user-level events;
- applications using AIFrontKit do not inherit analytics automatically;
- deletion and retention are controlled by the research owner.

## Review cadence

Run the protocol for the first preview, before stable v1 and after any major
installation or adapter redesign. Compare cohorts by product version and release
channel. Do not compare individuals. Publish the resulting product decisions,
including work deliberately rejected, without publishing raw participant data.
