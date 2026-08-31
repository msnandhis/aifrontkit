import type { Artifact } from "@aifrontkit/core";
import { ArtifactReview, type ArtifactChange } from "./artifact-review.js";

export type ArtifactReviewFixtureId = "requested" | "streaming" | "submitting" | "accepted" | "changes-requested" | "failed" | "conflict" | "offline" | "empty" | "long-content";

export const artifactReviewQualityScenarios: readonly {
  id: ArtifactReviewFixtureId;
  expectation: string;
}[] = [
  { id: "requested", expectation: "Presents a version-bound unified diff with explicit accept and request-changes actions." },
  { id: "streaming", expectation: "Preserves partial content, communicates busy state and prevents premature decisions." },
  { id: "submitting", expectation: "Keeps the review pending and prevents duplicate decisions while intent is in flight." },
  { id: "accepted", expectation: "Communicates the confirmed resolution and removes duplicate decision actions." },
  { id: "changes-requested", expectation: "Keeps confirmed feedback associated with the artifact version." },
  { id: "failed", expectation: "Preserves the last available diff and associates generation failure with the artifact." },
  { id: "conflict", expectation: "Disables stale decisions and offers a route to the latest artifact version." },
  { id: "offline", expectation: "Keeps an in-progress feedback draft visible while decision actions are unavailable." },
  { id: "empty", expectation: "Explains that no review decision is needed without rendering an empty diff surface." },
  { id: "long-content", expectation: "Contains long paths and code lines without widening the page at 375 pixels." },
];

const standardChange: ArtifactChange = {
  path: "src/runtime/create-runtime.ts",
  summary: "Make reconnect attempts recoverable without changing the public runtime contract.",
  provenanceLabel: "Agent patch from reconnect task",
  additions: 4,
  deletions: 2,
  lines: [
    { kind: "context", oldLine: 18, newLine: 18, content: "export function createRuntime(options: RuntimeOptions) {" },
    { kind: "deletion", oldLine: 19, content: "  const retryLimit = 1;" },
    { kind: "addition", newLine: 19, content: "  const retryLimit = options.retryLimit ?? 3;" },
    { kind: "addition", newLine: 20, content: "  const reconnect = createReconnectPolicy(retryLimit);" },
    { kind: "context", oldLine: 20, newLine: 21, content: "  return {" },
    { kind: "deletion", oldLine: 21, content: "    connect: () => transport.open()," },
    { kind: "addition", newLine: 22, content: "    connect: () => reconnect.run(() => transport.open())," },
    { kind: "addition", newLine: 23, content: "    cancel: () => reconnect.cancel()," },
    { kind: "context", oldLine: 22, newLine: 24, content: "  };" },
  ],
};

const longChange: ArtifactChange = {
  path: "src/features/agent-workspaces/reconnect-policies/restore-a-very-long-running-research-session-with-versioned-checkpoints.ts",
  summary: "Bind restored checkpoints to the exact artifact version that produced them.",
  provenanceLabel: "LangGraph adapter checkpoint recovery",
  additions: 2,
  deletions: 1,
  lines: [
    { kind: "deletion", oldLine: 104, content: "  return checkpoints.find((checkpoint) => checkpoint.sessionIdentifier === requestedSessionIdentifier);" },
    { kind: "addition", newLine: 104, content: "  return checkpoints.find((checkpoint) => checkpoint.sessionIdentifier === requestedSessionIdentifier && checkpoint.artifactVersion === requestedArtifactVersion);" },
    { kind: "addition", newLine: 105, content: "  // The full line remains reachable inside the contained code scroller without widening the application viewport." },
  ],
};

function artifactFor(scenario: ArtifactReviewFixtureId): Artifact {
  const version = scenario === "conflict" ? 4 : 3;
  const status = scenario === "streaming" ? "streaming" : scenario === "failed" ? "failed" : "ready";
  const reviewStatus = scenario === "accepted" ? "accepted" : scenario === "changes-requested" ? "changes-requested" : "requested";
  return {
    id: "runtime-reconnect-patch",
    title: scenario === "long-content" ? "Restore interrupted agent sessions without discarding the developer's unsubmitted review feedback" : "Runtime reconnect policy",
    kind: "code-diff",
    version,
    status,
    updatedAt: 40,
    content: { format: "unified-diff" },
    review: {
      version: scenario === "conflict" ? 3 : version,
      status: reviewStatus,
      updatedAt: 41,
      ...(scenario === "changes-requested" ? { comment: "Keep cancellation idempotent and add a reconnect timeout test." } : {}),
    },
    ...(scenario === "failed" ? { error: "Generation stopped before the final file was produced. The last successful diff is still available." } : {}),
  };
}

export function ArtifactReviewFixture({ scenario, emit }: { scenario: ArtifactReviewFixtureId; emit?(message: string): void }) {
  const artifact = artifactFor(scenario);
  const change = scenario === "long-content" ? longChange : scenario === "empty" ? { ...standardChange, additions: 0, deletions: 0, lines: [] } : standardChange;
  return (
    <div data-fixture-pattern="artifact-review" data-fixture-scenario={scenario}>
      <ArtifactReview
        artifact={artifact}
        change={change}
        offline={scenario === "offline"}
        decisionPending={scenario === "submitting"}
        initialFeedbackOpen={scenario === "offline"}
        {...(scenario === "offline" ? { initialFeedback: "Please keep the reconnect timeout configurable." } : {})}
        onAccept={({ artifactId, artifactVersion }) => emit?.(`onAccept(${artifactId}@${artifactVersion})`)}
        onRequestChanges={({ artifactId, artifactVersion, feedback }) => emit?.(`onRequestChanges(${artifactId}@${artifactVersion}, ${feedback})`)}
        onRetry={() => emit?.("onRetry()")}
        onReviewLatest={(artifactId) => emit?.(`onReviewLatest(${artifactId})`)}
      />
    </div>
  );
}
