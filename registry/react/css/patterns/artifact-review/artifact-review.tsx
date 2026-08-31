"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import type { Artifact } from "@aifrontkit/core";
import { ArtifactPrimitive } from "@aifrontkit/react/artifact";
import styles from "./artifact-review.module.css";

function classes(name: string, ...values: Array<string | undefined | false>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
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
