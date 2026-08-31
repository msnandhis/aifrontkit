import { createContext, useContext, type ComponentPropsWithoutRef, type PropsWithChildren, type ReactNode } from "react";
import type { Artifact } from "@aifrontkit/core";
import { useRuntimeState } from "../runtime/index.js";

interface ArtifactContextValue {
  artifact: Artifact;
  onAccept: ((artifact: Artifact) => void) | undefined;
  onRequestChanges: ((artifact: Artifact) => void) | undefined;
  onReject: ((artifact: Artifact) => void) | undefined;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

export interface ArtifactRootProps extends PropsWithChildren<ComponentPropsWithoutRef<"section">> {
  artifact?: Artifact;
  artifactId?: string;
  onAccept?(artifact: Artifact): void;
  onRequestChanges?(artifact: Artifact): void;
  onReject?(artifact: Artifact): void;
}

function isCurrentReviewRequested(artifact: Artifact) {
  return artifact.status === "ready" && artifact.review?.status === "requested" && artifact.review.version === artifact.version;
}

function Frame({ artifact, onAccept, onRequestChanges, onReject, children, ...props }: ArtifactRootProps & { artifact: Artifact }) {
  const reviewCurrent = artifact.review?.version === artifact.version;
  return (
    <ArtifactContext.Provider value={{ artifact, onAccept, onRequestChanges, onReject }}>
      <section
        aria-label={`Artifact: ${artifact.title}`}
        aria-busy={artifact.status === "streaming"}
        data-aifk-artifact=""
        data-status={artifact.status}
        data-version={artifact.version}
        data-review-status={reviewCurrent ? artifact.review?.status : artifact.review ? "stale" : "none"}
        data-review-stale={artifact.review && !reviewCurrent ? "true" : undefined}
        {...props}
      >
        {children}
      </section>
    </ArtifactContext.Provider>
  );
}

function RuntimeRoot({ artifactId, ...props }: Omit<ArtifactRootProps, "artifact"> & { artifactId: string }) {
  const artifact = useRuntimeState((state) => state.artifacts[artifactId]);
  return artifact ? <Frame {...props} artifact={artifact} /> : null;
}

function Root({ artifact, artifactId, ...props }: ArtifactRootProps) {
  if (artifact) return <Frame {...props} artifact={artifact} />;
  if (artifactId) return <RuntimeRoot {...props} artifactId={artifactId} />;
  throw new Error("ArtifactPrimitive.Root requires either `artifact` or `artifactId`.");
}

export interface ArtifactTitleProps extends ComponentPropsWithoutRef<"h3"> {
  as?: "h2" | "h3" | "h4";
}

function Title({ as: Heading = "h3", ...props }: ArtifactTitleProps) {
  const { artifact } = useArtifact();
  return <Heading data-aifk-artifact-title="" {...props}>{props.children ?? artifact.title}</Heading>;
}

function Kind(props: ComponentPropsWithoutRef<"span">) {
  const { artifact } = useArtifact();
  return <span data-aifk-artifact-kind="" {...props}>{props.children ?? artifact.kind}</span>;
}

function Version(props: ComponentPropsWithoutRef<"span">) {
  const { artifact } = useArtifact();
  return <span data-aifk-artifact-version="" {...props}>{props.children ?? `Version ${artifact.version}`}</span>;
}

function Status(props: ComponentPropsWithoutRef<"span">) {
  const { artifact } = useArtifact();
  return <span role="status" aria-atomic="true" data-aifk-artifact-status="" {...props}>{props.children ?? artifact.status}</span>;
}

function ReviewStatus(props: ComponentPropsWithoutRef<"span">) {
  const { artifact } = useArtifact();
  if (!artifact.review) return null;
  const current = artifact.review.version === artifact.version;
  return <span role="status" aria-atomic="true" data-aifk-artifact-review-status="" data-review-version={artifact.review.version} data-current={current} {...props}>{props.children ?? artifact.review.status}</span>;
}

export interface ArtifactContentProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  children?: ReactNode | ((content: unknown, artifact: Artifact) => ReactNode);
}

function Content({ children, ...props }: ArtifactContentProps) {
  const { artifact } = useArtifact();
  const fallback = typeof artifact.content === "string" || typeof artifact.content === "number" ? artifact.content : null;
  const content = typeof children === "function" ? children(artifact.content, artifact) : children ?? fallback;
  return <div data-aifk-artifact-content="" {...props}>{content}</div>;
}

function ArtifactError(props: ComponentPropsWithoutRef<"p">) {
  const { artifact } = useArtifact();
  if (!artifact.error) return null;
  return <p role="alert" data-aifk-artifact-error="" {...props}>{props.children ?? artifact.error}</p>;
}

function Accept(props: ComponentPropsWithoutRef<"button">) {
  const { artifact, onAccept } = useArtifact();
  const actionable = isCurrentReviewRequested(artifact);
  return (
    <button
      type="button"
      data-aifk-artifact-accept=""
      {...props}
      disabled={Boolean(props.disabled) || !actionable || !onAccept}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && actionable) onAccept?.(artifact);
      }}
    >
      {props.children ?? "Accept"}
    </button>
  );
}

function ReviewAction({ action, defaultLabel, ...props }: ComponentPropsWithoutRef<"button"> & { action: "request-changes" | "reject"; defaultLabel: string }) {
  const { artifact, onRequestChanges, onReject } = useArtifact();
  const callback = action === "reject" ? onReject : onRequestChanges;
  const actionable = isCurrentReviewRequested(artifact);
  return (
    <button
      type="button"
      data-aifk-artifact-review-action={action}
      {...props}
      disabled={Boolean(props.disabled) || !actionable || !callback}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented && actionable) callback?.(artifact);
      }}
    >
      {props.children ?? defaultLabel}
    </button>
  );
}

function RequestChanges(props: ComponentPropsWithoutRef<"button">) {
  return <ReviewAction action="request-changes" defaultLabel="Request changes" {...props} />;
}

function Reject(props: ComponentPropsWithoutRef<"button">) {
  return <ReviewAction action="reject" defaultLabel="Reject" {...props} />;
}

function useArtifact() {
  const value = useContext(ArtifactContext);
  if (!value) throw new Error("ArtifactPrimitive component must be inside ArtifactPrimitive.Root.");
  return value;
}

export const ArtifactPrimitive = { Root, Title, Kind, Version, Status, ReviewStatus, Content, Error: ArtifactError, Accept, RequestChanges, Reject };
