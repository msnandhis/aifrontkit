---
title: Artifact review
description: Review a generated code diff with version-safe accept, feedback and conflict recovery behavior.
status: experimental
---

# Artifact review

`ArtifactReview` is a production pattern for reviewing a source-owned single-file unified diff. It combines the provider-neutral artifact primitive with explicit review intent, progressive feedback and safe handling for stale versions.

## End-to-end flow

1. Render partial diff content while the artifact is streaming, without decision actions.
2. Present the complete diff when the artifact becomes ready and its review status is requested.
3. Emit accept or request-changes intent with both the artifact ID and reviewed version.
4. Keep the interface unresolved until a confirming runtime event arrives.
5. If a newer version arrives first, disable decisions and offer **Review latest**.

## Production states

| State | Interface responsibility |
| --- | --- |
| Requested | Show version, file summary, readable diff and both decision paths. |
| Streaming | Preserve partial content, announce updating state and hide decisions. |
| Submitting | Keep the current diff visible, mark the review busy and prevent duplicate decisions. |
| Accepted | Show the confirmed version resolution and prevent duplicate submission. |
| Changes requested | Keep confirmed feedback visible and associated with its version. |
| Failed | Preserve the last usable diff and show a retryable decision error beside it. |
| Conflict | Explain the reviewed and current versions, disable decisions and offer recovery. |
| Offline | Preserve feedback, disable submission and provide a reconnect action. |
| Empty | Explain that there is no reviewable text change instead of rendering an empty diff. |
| Long content | Contain code overflow inside the diff instead of widening the page. |

## Feedback behavior

Request changes opens an inline labelled textarea only when needed. Feedback must contain non-whitespace text. Command+Enter and Ctrl+Enter submit the request. Escape closes an empty draft and returns focus to the trigger, but never discards non-empty feedback. An offline transition or failed submission keeps the current draft so the reviewer can retry without rewriting it.

## Accessible diff semantics

Every added line has a visible `+` marker and an accessible “Added line” label. Deleted lines use `-` and “Deleted line”. Color reinforces these states but never carries the meaning alone. At 375 pixels the card actions stack, the page remains contained and long code stays reachable inside the diff scroller.

## Application boundary

The pattern does not parse patches, authorize reviewers, persist feedback or mutate artifact state. Normalize one provider patch into an `ArtifactChange` and send callbacks through your adapter.

```tsx
<ArtifactReview
  artifact={runtime.artifacts[artifactId]}
  change={normalizedDiff}
  offline={runtime.connection.status === "offline"}
  decisionPending={decision.status === "submitting"}
  decisionError={decisionError}
  onAccept={sendAcceptIntent}
  onRequestChanges={sendChangesIntent}
  onRetry={retryDecisionOrConnection}
  onReviewLatest={openLatestVersion}
/>
```
