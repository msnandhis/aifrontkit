"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Artifact } from "@aifrontkit/core";
import { ArtifactPrimitive } from "@aifrontkit/react/artifact";

const classNames: Record<string, string> = {
  "aifk-artifact-review": "aifk-artifact-review @container grid w-full min-w-0 gap-[var(--aifk-space-4,1rem)] border-y border-[var(--aifk-border-strong,ButtonBorder)] bg-transparent p-[clamp(var(--aifk-space-4,1rem),3cqi,var(--aifk-space-6,1.5rem))] font-[var(--aifk-type-font-family-sans,ui-sans-serif)] text-[var(--aifk-text,CanvasText)] [&_h2]:m-0 [&_h3]:m-0 [&_h4]:m-0 [&_p]:m-0 [&_button:hover:not(:disabled)]:border-[var(--aifk-text,CanvasText)] [&_button:active:not(:disabled)]:bg-[var(--aifk-surface-subtle,Canvas)] [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-[var(--aifk-focus,Highlight)] [&_button:disabled]:cursor-not-allowed [&_button:disabled]:opacity-50 [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-offset-2 [&_textarea:focus-visible]:outline-[var(--aifk-focus,Highlight)] motion-reduce:[&_*]:duration-[0.01ms]! motion-reduce:[&_*]:scroll-auto motion-reduce:[&_*::before]:duration-[0.01ms]! motion-reduce:[&_*::after]:duration-[0.01ms]!",
  "aifk-artifact-review__header": "aifk-artifact-review__header flex items-start justify-between gap-[var(--aifk-space-4,1rem)] @max-[30rem]:grid",
  "aifk-artifact-review__identity": "aifk-artifact-review__identity grid min-w-0 gap-[var(--aifk-space-2,0.5rem)]",
  "aifk-artifact-review__eyebrow": "aifk-artifact-review__eyebrow text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[var(--aifk-type-font-weight-bold,700)] uppercase tracking-[var(--aifk-type-letter-spacing-wide,0.08em)] text-[var(--aifk-accent,Highlight)]",
  "aifk-artifact-review__title": "aifk-artifact-review__title [overflow-wrap:anywhere] text-[length:clamp(var(--aifk-type-font-size-lg,1.125rem),4cqi,var(--aifk-type-font-size-xl,1.25rem))] leading-[var(--aifk-type-line-height-tight,1.25)] tracking-[var(--aifk-type-letter-spacing-tight,-0.01em)]",
  "aifk-artifact-review__metadata": "aifk-artifact-review__metadata flex flex-wrap gap-x-[var(--aifk-space-4,1rem)] gap-y-[var(--aifk-space-2,0.5rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] text-[var(--aifk-text-muted,GrayText)]",
  "aifk-artifact-review__meta-label": "aifk-artifact-review__meta-label me-[var(--aifk-space-1,0.25rem)] text-[var(--aifk-text-subtle,GrayText)]",
  "aifk-artifact-review__statuses": "aifk-artifact-review__statuses flex shrink-0 flex-wrap justify-end gap-[var(--aifk-space-2,0.5rem)] @max-[30rem]:justify-start",
  "aifk-artifact-review__status": "aifk-artifact-review__status min-h-7 py-[var(--aifk-space-1,0.25rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[var(--aifk-type-font-weight-semibold,600)] capitalize text-[var(--aifk-text-muted,GrayText)]",
  "aifk-artifact-review__review-status": "aifk-artifact-review__review-status min-h-7 py-[var(--aifk-space-1,0.25rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] font-[var(--aifk-type-font-weight-semibold,600)] capitalize text-[var(--aifk-text-muted,GrayText)]",
  "aifk-artifact-review__notice": "aifk-artifact-review__notice flex items-center justify-between gap-[var(--aifk-space-4,1rem)] rounded-[var(--aifk-radius-medium,0.625rem)] border border-s-4 border-[var(--aifk-border-strong,ButtonBorder)] border-s-[var(--aifk-warning,CanvasText)] bg-[var(--aifk-surface-subtle,Canvas)] px-[var(--aifk-space-4,1rem)] py-[var(--aifk-space-3,0.75rem)] [&>div]:grid [&>div]:min-w-0 [&>div]:gap-[var(--aifk-space-1,0.25rem)] [&_strong]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_button]:min-h-[max(2.75rem,var(--aifk-space-touch-target,2.75rem))] [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-control,0.5rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface,Canvas)] [&_button]:px-[var(--aifk-space-4,1rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button]:text-[var(--aifk-text,CanvasText)] [&_button]:transition-[background-color,border-color] [&_button]:duration-[var(--aifk-motion-duration-fast,120ms)] [&_button]:ease-[var(--aifk-motion-easing-standard,ease-out)] @max-[30rem]:grid @max-[30rem]:[&_button]:w-full forced-colors:border-2 forced-colors:border-[CanvasText]",
  "aifk-artifact-review__notice--conflict": "aifk-artifact-review__notice--conflict",
  "aifk-artifact-review__notice--error": "aifk-artifact-review__notice--error border-s-[var(--aifk-destructive,CanvasText)]",
  "aifk-artifact-review__artifact-error": "aifk-artifact-review__artifact-error m-0 rounded-[var(--aifk-radius-medium,0.625rem)] border border-[var(--aifk-destructive,CanvasText)] bg-[color-mix(in_srgb,var(--aifk-destructive,CanvasText)_8%,var(--aifk-surface,Canvas))] px-[var(--aifk-space-4,1rem)] py-[var(--aifk-space-3,0.75rem)] text-[var(--aifk-destructive,CanvasText)] empty:hidden",
  "aifk-artifact-review__workspace": "aifk-artifact-review__workspace grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(17rem,18rem)] items-start gap-[var(--aifk-space-6,1.5rem)] @max-[36rem]:grid-cols-1",
  "aifk-artifact-review__diff-column": "aifk-artifact-review__diff-column grid min-w-0 gap-[var(--aifk-space-4,1rem)]",
  "aifk-artifact-review__rail": "aifk-artifact-review__rail grid min-w-0 gap-[var(--aifk-space-4,1rem)] border-s border-[var(--aifk-border,ButtonBorder)] ps-[var(--aifk-space-5,1.25rem)] @max-[36rem]:border-s-0 @max-[36rem]:border-t @max-[36rem]:ps-0 @max-[36rem]:pt-[var(--aifk-space-5,1.25rem)]",
  "aifk-artifact-review__context": "aifk-artifact-review__context grid gap-[var(--aifk-space-2,0.5rem)] [&_h3]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_dl]:m-0 [&_dl]:mt-[var(--aifk-space-2,0.5rem)] [&_dl]:grid [&_dl]:gap-[var(--aifk-space-1,0.25rem)] [&_dl]:border-t [&_dl]:border-[var(--aifk-border,ButtonBorder)] [&_dl]:pt-[var(--aifk-space-3,0.75rem)] [&_dt]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_dt]:text-[var(--aifk-text-subtle,GrayText)] [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:[overflow-wrap:anywhere] [&_dd]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_dd]:font-[var(--aifk-type-font-weight-semibold,600)]",
  "aifk-artifact-review__summary": "aifk-artifact-review__summary grid grid-cols-3 border-y border-[var(--aifk-border,ButtonBorder)] [&>div]:flex [&>div]:min-w-0 [&>div]:items-baseline [&>div]:gap-[var(--aifk-space-2,0.5rem)] [&>div]:py-[var(--aifk-space-3,0.75rem)] [&>div+div]:border-s [&>div+div]:border-[var(--aifk-border,ButtonBorder)] [&>div+div]:ps-[var(--aifk-space-4,1rem)] [&_strong]:font-[var(--aifk-type-font-family-mono,ui-monospace)] [&_strong]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_span]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_span]:text-[var(--aifk-text-muted,GrayText)] @max-[30rem]:grid-cols-2 @max-[30rem]:[&>div:first-child]:col-span-full @max-[30rem]:[&>div:first-child]:border-b @max-[30rem]:[&>div:first-child]:border-[var(--aifk-border,ButtonBorder)] @max-[30rem]:[&>div:nth-child(2)]:border-s-0 @max-[30rem]:[&>div:nth-child(2)]:ps-0",
  "aifk-artifact-review__addition-summary": "aifk-artifact-review__addition-summary text-[var(--aifk-success,CanvasText)]!",
  "aifk-artifact-review__deletion-summary": "aifk-artifact-review__deletion-summary text-[var(--aifk-destructive,CanvasText)]!",
  "aifk-artifact-review__content": "aifk-artifact-review__content grid min-w-0 gap-[var(--aifk-space-4,1rem)]",
  "aifk-artifact-review__file": "aifk-artifact-review__file min-w-0 overflow-hidden border-y border-[var(--aifk-border,ButtonBorder)] [&>header]:flex [&>header]:min-w-0 [&>header]:items-center [&>header]:justify-between [&>header]:gap-[var(--aifk-space-3,0.75rem)] [&>header]:border-b [&>header]:border-[var(--aifk-border,ButtonBorder)] [&>header]:bg-[var(--aifk-surface-subtle,Canvas)] [&>header]:p-[var(--aifk-space-3,0.75rem)] [&>header]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&>header>code]:min-w-0 [&>header>code]:truncate [&>header>span]:shrink-0 [&>header>span]:font-[var(--aifk-type-font-family-mono,ui-monospace)] @max-[30rem]:[&>header]:items-start",
  "aifk-artifact-review__diff": "aifk-artifact-review__diff min-w-0 overflow-x-auto overscroll-x-contain bg-[var(--aifk-artifact-surface,Canvas)]",
  "aifk-artifact-review__line": "aifk-artifact-review__line group grid min-w-max grid-cols-[2rem_3rem_3rem_minmax(max-content,1fr)] border-b border-[var(--aifk-border,ButtonBorder)] font-[var(--aifk-type-font-family-mono,ui-monospace)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] last:border-b-0 data-[kind=addition]:bg-[color-mix(in_srgb,var(--aifk-success,CanvasText)_8%,var(--aifk-artifact-surface,Canvas))] data-[kind=deletion]:bg-[color-mix(in_srgb,var(--aifk-destructive,CanvasText)_8%,var(--aifk-artifact-surface,Canvas))] @max-[30rem]:grid-cols-[2rem_2.5rem_2.5rem_minmax(max-content,1fr)] forced-colors:data-[kind=addition]:border-s-4 forced-colors:data-[kind=addition]:border-s-[CanvasText] forced-colors:data-[kind=deletion]:border-s-4 forced-colors:data-[kind=deletion]:border-s-[CanvasText] [&>code]:block [&>code]:min-w-0 [&>code]:whitespace-pre [&>code]:px-[var(--aifk-space-3,0.75rem)] [&>code]:py-[var(--aifk-space-1,0.25rem)] [&>code]:text-[var(--aifk-text,CanvasText)]",
  "aifk-artifact-review__line-label": "aifk-artifact-review__line-label block select-none border-e border-[var(--aifk-border,ButtonBorder)] bg-[color-mix(in_srgb,var(--aifk-surface-subtle,Canvas)_82%,transparent)] px-[var(--aifk-space-2,0.5rem)] py-[var(--aifk-space-1,0.25rem)] text-center font-[var(--aifk-type-font-weight-bold,700)] text-[var(--aifk-text,CanvasText)] group-data-[kind=addition]:text-[var(--aifk-success,CanvasText)] group-data-[kind=deletion]:text-[var(--aifk-destructive,CanvasText)]",
  "aifk-artifact-review__line-number": "aifk-artifact-review__line-number block select-none border-e border-[var(--aifk-border,ButtonBorder)] bg-[color-mix(in_srgb,var(--aifk-surface-subtle,Canvas)_82%,transparent)] px-[var(--aifk-space-2,0.5rem)] py-[var(--aifk-space-1,0.25rem)] text-end text-[var(--aifk-text-subtle,GrayText)]",
  "aifk-artifact-review__empty": "aifk-artifact-review__empty border-y border-dashed border-[var(--aifk-border-strong,ButtonBorder)] p-[var(--aifk-space-6,1.5rem)] text-center text-[var(--aifk-text-muted,GrayText)]",
  "aifk-artifact-review__resolution": "aifk-artifact-review__resolution text-[length:var(--aifk-type-font-size-sm,0.875rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] text-[var(--aifk-text-muted,GrayText)] empty:hidden",
  "aifk-artifact-review__feedback": "aifk-artifact-review__feedback grid gap-[var(--aifk-space-3,0.75rem)] border-y border-[var(--aifk-border,ButtonBorder)] bg-transparent py-[var(--aifk-space-4,1rem)] [&>div:first-child]:grid [&>div:first-child]:gap-[var(--aifk-space-1,0.25rem)] [&_h3]:text-[length:var(--aifk-type-font-size-md,1rem)] [&_p]:text-[length:var(--aifk-type-font-size-xs,0.75rem)] [&_p]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_p]:text-[var(--aifk-text-muted,GrayText)] [&_label]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_label]:font-[var(--aifk-type-font-weight-semibold,600)] [&_textarea]:box-border [&_textarea]:min-h-28 [&_textarea]:w-full [&_textarea]:resize-y [&_textarea]:rounded-[var(--aifk-radius-control,0.5rem)] [&_textarea]:border [&_textarea]:border-[var(--aifk-input-border,ButtonBorder)] [&_textarea]:bg-[var(--aifk-input,Canvas)] [&_textarea]:p-[var(--aifk-space-3,0.75rem)] [&_textarea]:font-[inherit] [&_textarea]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_textarea]:leading-[var(--aifk-type-line-height-relaxed,1.6)] [&_textarea]:text-[var(--aifk-text,CanvasText)] [&_textarea[aria-invalid=true]]:border-[var(--aifk-destructive,CanvasText)] @max-[30rem]:[&_textarea]:text-[length:var(--aifk-type-font-size-md,1rem)]",
  "aifk-artifact-review__feedback-meta": "aifk-artifact-review__feedback-meta flex justify-between gap-[var(--aifk-space-3,0.75rem)] text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[var(--aifk-type-line-height-relaxed,1.6)] text-[var(--aifk-text-muted,GrayText)] @max-[30rem]:grid",
  "aifk-artifact-review__field-error": "aifk-artifact-review__field-error font-[var(--aifk-type-font-weight-medium,500)] text-[var(--aifk-destructive,CanvasText)]",
  "aifk-artifact-review__actions": "aifk-artifact-review__actions grid grid-cols-1 justify-end gap-[var(--aifk-space-2,0.5rem)] [&_button]:min-h-[max(2.75rem,var(--aifk-space-touch-target,2.75rem))] [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-control,0.5rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface,Canvas)] [&_button]:px-[var(--aifk-space-4,1rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button]:text-[var(--aifk-text,CanvasText)] [&_button]:transition-[background-color,border-color] [&_button]:duration-[var(--aifk-motion-duration-fast,120ms)] [&_button]:ease-[var(--aifk-motion-easing-standard,ease-out)] [&>*:last-child]:border-[var(--aifk-action,CanvasText)] [&>*:last-child]:bg-[var(--aifk-action,CanvasText)] [&>*:last-child]:text-[var(--aifk-action-foreground,Canvas)] @max-[36rem]:grid-cols-2 @max-[30rem]:grid-cols-1 @max-[30rem]:[&_button]:w-full",
  "aifk-artifact-review__feedback-actions": "aifk-artifact-review__feedback-actions grid grid-cols-1 justify-end gap-[var(--aifk-space-2,0.5rem)] [&_button]:min-h-[max(2.75rem,var(--aifk-space-touch-target,2.75rem))] [&_button]:cursor-pointer [&_button]:rounded-[var(--aifk-radius-control,0.5rem)] [&_button]:border [&_button]:border-[var(--aifk-border-strong,ButtonBorder)] [&_button]:bg-[var(--aifk-surface,Canvas)] [&_button]:px-[var(--aifk-space-4,1rem)] [&_button]:font-[inherit] [&_button]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] [&_button]:font-[var(--aifk-type-font-weight-semibold,600)] [&_button]:text-[var(--aifk-text,CanvasText)] [&_button]:transition-[background-color,border-color] [&_button]:duration-[var(--aifk-motion-duration-fast,120ms)] [&_button]:ease-[var(--aifk-motion-easing-standard,ease-out)] [&>*:last-child]:border-[var(--aifk-action,CanvasText)] [&>*:last-child]:bg-[var(--aifk-action,CanvasText)] [&>*:last-child]:text-[var(--aifk-action-foreground,Canvas)] @max-[36rem]:grid-cols-2 @max-[30rem]:grid-cols-1 @max-[30rem]:[&_button]:w-full",
  "aifk-artifact-review__sr-only": "aifk-artifact-review__sr-only absolute size-px overflow-hidden whitespace-nowrap [clip-path:inset(50%)] [clip:rect(0_0_0_0)]",
};

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).map((value) => classNames[value as string] ?? value).join(" ");
}

export interface ArtifactDiffLine {
  kind: "context" | "addition" | "deletion";
  content: string;
  oldLine?: number;
  newLine?: number;
}

export interface ArtifactChange {
  path: string;
  summary: string;
  provenanceLabel?: string;
  additions: number;
  deletions: number;
  lines: readonly ArtifactDiffLine[];
}

export interface ArtifactReviewDecision {
  artifactId: string;
  artifactVersion: number;
}

export interface ArtifactChangesRequest extends ArtifactReviewDecision {
  feedback: string;
}

export interface ArtifactReviewProps {
  artifact?: Artifact;
  artifactId?: string;
  change: ArtifactChange;
  className?: string;
  offline?: boolean;
  decisionPending?: boolean;
  decisionError?: string;
  initialFeedback?: string;
  initialFeedbackOpen?: boolean;
  onAccept?(decision: ArtifactReviewDecision): void;
  onRequestChanges?(request: ArtifactChangesRequest): void;
  onRetry?(): void;
  onReviewLatest?(artifactId: string): void;
}

export function ArtifactReview({
  artifact,
  artifactId,
  change,
  className,
  offline = false,
  decisionPending = false,
  decisionError,
  initialFeedback = "",
  initialFeedbackOpen = false,
  onAccept,
  onRequestChanges,
  onRetry,
  onReviewLatest,
}: ArtifactReviewProps) {
  const [showFeedback, setShowFeedback] = useState(initialFeedbackOpen);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [feedbackError, setFeedbackError] = useState<string>();
  const feedbackId = useId();
  const feedbackErrorId = useId();
  const feedbackRef = useRef<HTMLTextAreaElement>(null);
  const requestButtonRef = useRef<HTMLButtonElement>(null);
  const resolutionRef = useRef<HTMLParagraphElement>(null);
  const feedbackOpened = useRef(false);
  const rootProps = artifact ? { artifact } : artifactId ? { artifactId } : undefined;
  const reviewStatus = artifact?.review?.status;
  const previousReviewStatus = useRef(reviewStatus);

  useEffect(() => {
    if (showFeedback) {
      feedbackOpened.current = true;
      feedbackRef.current?.focus();
    } else if (feedbackOpened.current) {
      requestButtonRef.current?.focus();
    }
  }, [showFeedback]);

  const currentArtifactId = artifact?.id ?? artifactId!;
  const currentVersion = artifact?.version ?? 0;
  const reviewVersion = artifact?.review?.version;
  const conflict = reviewVersion !== undefined && reviewVersion !== currentVersion;
  const hasChanges = change.lines.length > 0 && (change.additions > 0 || change.deletions > 0);
  const requested = artifact?.status === "ready" && artifact.review?.status === "requested" && !conflict;
  const canDecide = requested && hasChanges && !offline && !decisionPending;

  useEffect(() => {
    const previous = previousReviewStatus.current;
    if (previous === "requested" && (reviewStatus === "accepted" || reviewStatus === "changes-requested")) {
      resolutionRef.current?.focus();
    }
    previousReviewStatus.current = reviewStatus;
  }, [reviewStatus]);

  if (!rootProps) throw new Error("ArtifactReview requires either `artifact` or `artifactId`.");

  const accept = () => {
    if (!canDecide || !onAccept) return;
    onAccept({ artifactId: currentArtifactId, artifactVersion: currentVersion });
  };

  const requestChanges = () => {
    if (!canDecide || !onRequestChanges) return;
    const trimmedFeedback = feedback.trim();
    if (!trimmedFeedback) {
      setFeedbackError("Describe the changes needed before submitting.");
      feedbackRef.current?.focus();
      return;
    }
    setFeedbackError(undefined);
    onRequestChanges({ artifactId: currentArtifactId, artifactVersion: currentVersion, feedback: trimmedFeedback });
  };

  const handleFeedbackKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape" && !feedback.trim()) {
      event.preventDefault();
      setFeedbackError(undefined);
      setShowFeedback(false);
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      requestChanges();
    }
  };

  return (
    <ArtifactPrimitive.Root
      {...rootProps}
      className={classes("aifk-artifact-review", className)}
      aria-label={artifact ? `Artifact review: ${artifact.title}` : "Artifact review"}
      aria-busy={artifact?.status === "streaming" || decisionPending || undefined}
      onAccept={accept}
      onRequestChanges={requestChanges}
      data-conflict={conflict || undefined}
      data-offline={offline || undefined}
    >
      <header className={classes("aifk-artifact-review__header")}>
        <div className={classes("aifk-artifact-review__identity")}>
          <span className={classes("aifk-artifact-review__eyebrow")}>Artifact review</span>
          <ArtifactPrimitive.Title as="h2" className={classes("aifk-artifact-review__title")} />
          <div className={classes("aifk-artifact-review__metadata")}>
            <span><span className={classes("aifk-artifact-review__meta-label")}>Kind</span> <ArtifactPrimitive.Kind /></span>
            <span><ArtifactPrimitive.Version /></span>
          </div>
        </div>
        <div className={classes("aifk-artifact-review__statuses")}>
          <ArtifactPrimitive.Status className={classes("aifk-artifact-review__status")} />
          <ArtifactPrimitive.ReviewStatus className={classes("aifk-artifact-review__review-status")} />
        </div>
      </header>

      {conflict ? (
        <div className={classes("aifk-artifact-review__notice", "aifk-artifact-review__notice--conflict")} role="alert">
          <div>
            <strong>Newer version available</strong>
            <p>This review targets version {reviewVersion}, but version {currentVersion} is now current. Decisions are disabled until you review the latest changes.</p>
          </div>
          {onReviewLatest ? <button type="button" onClick={() => onReviewLatest(currentArtifactId)}>Review latest</button> : null}
        </div>
      ) : null}

      {offline ? (
        <div className={classes("aifk-artifact-review__notice")} role="status">
          <div><strong>You are offline</strong><p>Your feedback stays here. Reconnect before submitting a decision.</p></div>
          {onRetry ? <button type="button" onClick={onRetry}>Retry connection</button> : null}
        </div>
      ) : null}

      {decisionError ? (
        <div className={classes("aifk-artifact-review__notice", "aifk-artifact-review__notice--error")} role="alert">
          <div><strong>Decision was not sent</strong><p>{decisionError}</p></div>
          {onRetry ? <button type="button" onClick={onRetry}>Retry decision</button> : null}
        </div>
      ) : null}

      <ArtifactPrimitive.Error className={classes("aifk-artifact-review__artifact-error")} />

      <div className={classes("aifk-artifact-review__workspace")}>
        <div className={classes("aifk-artifact-review__diff-column")}>
          {hasChanges ? (
            <>
              <section className={classes("aifk-artifact-review__summary")} aria-label="Change summary">
                <div><strong>1</strong><span>file changed</span></div>
                <div className={classes("aifk-artifact-review__addition-summary")}><strong>+{change.additions}</strong><span>additions</span></div>
                <div className={classes("aifk-artifact-review__deletion-summary")}><strong>-{change.deletions}</strong><span>deletions</span></div>
              </section>

              <ArtifactPrimitive.Content className={classes("aifk-artifact-review__content")}>
                <ArtifactDiff change={change} />
              </ArtifactPrimitive.Content>
            </>
          ) : (
            <div className={classes("aifk-artifact-review__empty")} role="status">
              <strong>No reviewable changes</strong>
              <p>This artifact version does not contain a text change that needs a decision.</p>
            </div>
          )}
        </div>

        <aside className={classes("aifk-artifact-review__rail")} aria-label="Review decision">
          <section className={classes("aifk-artifact-review__context")}>
            <h3>Review context</h3>
            <p>{change.summary}</p>
            {change.provenanceLabel ? <dl><dt>Source</dt><dd>{change.provenanceLabel}</dd></dl> : null}
          </section>

          <p ref={resolutionRef} className={classes("aifk-artifact-review__resolution")} role="status" aria-live="polite" aria-atomic="true" tabIndex={-1}>
            {resolutionMessage(artifact, conflict, decisionPending, hasChanges)}
          </p>

          {requested && showFeedback ? (
            <section className={classes("aifk-artifact-review__feedback")} aria-labelledby={`${feedbackId}-heading`}>
              <div>
                <h3 id={`${feedbackId}-heading`}>Request changes</h3>
                <p>Give specific guidance tied to version {currentVersion}.</p>
              </div>
              <label htmlFor={feedbackId}>Feedback</label>
              <textarea
                ref={feedbackRef}
                id={feedbackId}
                value={feedback}
                rows={5}
                onChange={(event) => {
                  setFeedback(event.target.value);
                  if (feedbackError && event.target.value.trim()) setFeedbackError(undefined);
                }}
                onBlur={() => {
                  if (!feedback.trim()) setFeedbackError("Describe the changes needed before submitting.");
                }}
                onKeyDown={handleFeedbackKeyDown}
                aria-invalid={Boolean(feedbackError)}
                aria-describedby={feedbackError ? feedbackErrorId : `${feedbackId}-hint`}
              />
              <div className={classes("aifk-artifact-review__feedback-meta")}>
                <span id={`${feedbackId}-hint`}>{feedback.trim() ? `Press ${platformShortcut()}+Enter to submit.` : "Escape closes an empty draft."}</span>
                {feedbackError ? <span id={feedbackErrorId} className={classes("aifk-artifact-review__field-error")} role="alert">{feedbackError}</span> : null}
              </div>
              <div className={classes("aifk-artifact-review__feedback-actions")}>
                <button type="button" onClick={() => { setShowFeedback(false); setFeedbackError(undefined); }}>Cancel</button>
                <ArtifactPrimitive.RequestChanges disabled={!canDecide || !onRequestChanges}>Submit request</ArtifactPrimitive.RequestChanges>
              </div>
            </section>
          ) : null}

          {requested && !showFeedback ? (
            <footer className={classes("aifk-artifact-review__actions")}>
              <button ref={requestButtonRef} type="button" onClick={() => setShowFeedback(true)} disabled={!canDecide || !onRequestChanges}>Request changes</button>
              <ArtifactPrimitive.Accept disabled={!canDecide || !onAccept}>Accept version</ArtifactPrimitive.Accept>
            </footer>
          ) : null}
        </aside>
      </div>
    </ArtifactPrimitive.Root>
  );
}

function ArtifactDiff({ change }: { change: ArtifactChange }) {
  return (
    <section className={classes("aifk-artifact-review__file")} aria-label={`Changes in ${change.path}`}>
      <header>
        <code title={change.path}>{change.path}</code>
        <span><span className={classes("aifk-artifact-review__addition-summary")}>+{change.additions}</span> <span className={classes("aifk-artifact-review__deletion-summary")}>-{change.deletions}</span></span>
      </header>
      <div className={classes("aifk-artifact-review__diff")} role="table" aria-label={`Unified diff for ${change.path}`} tabIndex={0}>
        {change.lines.map((line, index) => {
          const label = line.kind === "addition" ? "Added line" : line.kind === "deletion" ? "Deleted line" : "Unchanged line";
          const sign = line.kind === "addition" ? "+" : line.kind === "deletion" ? "-" : " ";
          return (
            <div className={classes("aifk-artifact-review__line")} data-kind={line.kind} role="row" key={`${line.oldLine ?? "new"}-${line.newLine ?? "old"}-${index}`}>
              <span className={classes("aifk-artifact-review__line-label")} role="cell"><span aria-hidden="true">{sign}</span><span className={classes("aifk-artifact-review__sr-only")}>{label}</span></span>
              <span className={classes("aifk-artifact-review__line-number")} role="cell" aria-label={line.oldLine ? `Old line ${line.oldLine}` : "No old line"}>{line.oldLine ?? ""}</span>
              <span className={classes("aifk-artifact-review__line-number")} role="cell" aria-label={line.newLine ? `New line ${line.newLine}` : "No new line"}>{line.newLine ?? ""}</span>
              <code role="cell">{line.content || " "}</code>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function resolutionMessage(artifact: Artifact | undefined, conflict: boolean, decisionPending: boolean, hasChanges: boolean) {
  if (!artifact) return "Artifact review state is loading.";
  if (conflict) return "Review paused because a newer artifact version is available.";
  if (!hasChanges) return "No review decision is required for this version.";
  if (decisionPending) return "Submitting decision. The review remains pending until the application confirms it.";
  if (artifact.status === "streaming") return "The artifact is still updating. Review actions will appear when this version is ready.";
  if (artifact.status === "failed") return artifact.error ?? "The artifact could not be generated.";
  if (artifact.review?.status === "accepted") return `Version ${artifact.version} was accepted.`;
  if (artifact.review?.status === "changes-requested") return artifact.review.comment ? `Changes requested: ${artifact.review.comment}` : `Changes were requested for version ${artifact.version}.`;
  return `Version ${artifact.version} is ready for review.`;
}

function platformShortcut() {
  if (typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)) return "Command";
  return "Ctrl";
}
