# Artifact review

`ArtifactReview` is a source-owned review surface for a single-file unified diff. It binds review state to the canonical artifact version while leaving persistence, authorization and transport in the host application.

## Behavior contract

- Accept and request-changes callbacks emit intent only. Render a final resolution after a confirming `artifact.updated` event.
- A review whose version differs from the current artifact is treated as a conflict. Decisions are disabled and `onReviewLatest` provides an explicit recovery path.
- Request changes progressively reveals a labelled feedback field. Non-whitespace feedback is required and Command+Enter or Ctrl+Enter submits.
- Feedback stays in component state when `offline` or `decisionError` changes. Neither condition discards the draft.
- Escape closes only an empty feedback form and returns focus to its trigger. Non-empty drafts are preserved.
- Streaming and failed artifacts preserve readable diff content but cannot be decided.
- Additions and deletions include visible `+` and `-` markers plus accessible text. Color is supplemental.

```tsx
<ArtifactReview
  artifact={runtime.artifacts[artifactId]}
  change={change}
  offline={connection.status === "offline"}
  decisionError={decisionError}
  onAccept={({ artifactId, artifactVersion }) =>
    transport.send({ type: "artifact.review.accept", artifactId, artifactVersion })
  }
  onRequestChanges={({ artifactId, artifactVersion, feedback }) =>
    transport.send({ type: "artifact.review.request-changes", artifactId, artifactVersion, feedback })
  }
  onReviewLatest={(artifactId) => navigate(`/artifacts/${artifactId}/latest`)}
/>
```

The `change` view model is intentionally local to the pattern. Provider-specific patch payloads should be normalized by an adapter instead of being added to the core artifact model.
