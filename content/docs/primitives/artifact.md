---
title: Artifact primitive
description: Render versioned generated work from controlled or normalized runtime state.
status: experimental
---

# Artifact primitive

`ArtifactPrimitive` exposes the identity, generation state, review state and content of an `Artifact` without prescribing its visual format. Pass a controlled `artifact` or select normalized runtime state with `artifactId`.

```tsx
<ArtifactPrimitive.Root
  artifactId={artifactId}
  onAccept={(artifact) => sendAcceptIntent(artifact.id, artifact.version)}
  onRequestChanges={(artifact) => openFeedbackFor(artifact.id, artifact.version)}
>
  <ArtifactPrimitive.Title />
  <ArtifactPrimitive.Kind />
  <ArtifactPrimitive.Version />
  <ArtifactPrimitive.Status />
  <ArtifactPrimitive.ReviewStatus />
  <ArtifactPrimitive.Content>
    <ArtifactRenderer />
  </ArtifactPrimitive.Content>
  <ArtifactPrimitive.Error />
  <ArtifactPrimitive.RequestChanges />
  <ArtifactPrimitive.Accept />
</ArtifactPrimitive.Root>
```

## Review safety

Artifact generation status and review status are separate. A streaming or failed artifact may preserve useful content, but review actions are enabled only when the artifact is ready and its requested review targets the current version.

Accept and request-changes actions emit user intent. They do not update the artifact optimistically. Wait for the runtime adapter to receive a confirming `artifact.updated` event before presenting an accepted or changes-requested resolution.

## Composition boundary

`ArtifactPrimitive.Content` renders application-owned children because `Artifact.content` is intentionally provider-neutral. Normalize provider-specific documents, code patches or structured outputs into a safe renderer outside the primitive.
