import type { Artifact } from "@aifrontkit/core";
import type { PlaygroundEnvironment, PlaygroundRecord, PlaygroundState } from "../types.js";
import { definePlayground, environmentControlsFor, environmentDefaults } from "../types.js";
import {
  ArtifactReviewFixture,
  type ArtifactReviewFixtureId,
} from "../../../../../registry/react/css/patterns/artifact-review/artifact-review.fixture.js";

interface ArtifactReviewProps extends PlaygroundRecord {
  scenario: ArtifactReviewFixtureId;
}

const version = "1.0.0";
const defaults: PlaygroundState<ArtifactReviewProps, PlaygroundEnvironment> = {
  props: { scenario: "requested" },
  environment: { ...environmentDefaults },
};

const scenarioDescriptions: Record<ArtifactReviewFixtureId, string> = {
  requested: "Review one stable artifact version and emit an explicit decision.",
  streaming: "Preserve partial changes while review actions remain unavailable.",
  submitting: "Keep the review pending until the host confirms the submitted decision.",
  accepted: "Show the confirmed accepted outcome without duplicate actions.",
  "changes-requested": "Keep confirmed feedback attached to the reviewed version.",
  failed: "Retain the last available diff beside a clear generation failure.",
  conflict: "Block a stale decision and direct the reviewer to the latest version.",
  offline: "Preserve an in-progress feedback draft until connectivity returns.",
  empty: "Explain when a version has no reviewable text changes.",
  "long-content": "Contain long paths and diff lines without widening the page.",
};

function codeArtifact(scenario: ArtifactReviewFixtureId): Artifact {
  const artifactVersion = scenario === "conflict" ? 4 : 3;
  return {
    id: "runtime-reconnect-patch",
    title: "Runtime reconnect policy",
    kind: "code-diff",
    version: artifactVersion,
    status: scenario === "streaming" ? "streaming" : scenario === "failed" ? "failed" : "ready",
    updatedAt: 40,
    review: {
      version: scenario === "conflict" ? 3 : artifactVersion,
      status: scenario === "accepted" ? "accepted" : scenario === "changes-requested" ? "changes-requested" : "requested",
      updatedAt: 41,
      ...(scenario === "changes-requested" ? { comment: "Keep cancellation idempotent and test the timeout." } : {}),
    },
    ...(scenario === "failed" ? { error: "Generation stopped before the final file was produced." } : {}),
  };
}

function codeChange(scenario: ArtifactReviewFixtureId) {
  if (scenario === "empty") {
    return {
      path: "src/runtime/create-runtime.ts",
      summary: "The generated version does not contain a reviewable text change.",
      provenanceLabel: "Agent patch from reconnect task",
      additions: 0,
      deletions: 0,
      lines: [],
    };
  }
  return {
    path: "src/runtime/create-runtime.ts",
    summary: "Make reconnect attempts recoverable without changing the public runtime contract.",
    provenanceLabel: "Agent patch from reconnect task",
    additions: 1,
    deletions: 1,
    lines: [
      { kind: "deletion", oldLine: 19, content: "  const retryLimit = 1;" },
      { kind: "addition", newLine: 19, content: "  const retryLimit = options.retryLimit ?? 3;" },
    ],
  };
}

export const artifactReviewPlayground = definePlayground<ArtifactReviewProps>({
  id: "artifact-review",
  version,
  label: "Artifact review",
  description: "Review a generated change with version safety, preserved feedback and explicit confirmation boundaries.",
  defaults,
  scenarios: (Object.keys(scenarioDescriptions) as ArtifactReviewFixtureId[]).map((scenario) => ({
    id: scenario,
    version,
    label: scenario.split("-").map((word) => word[0]!.toUpperCase() + word.slice(1)).join(" "),
    description: scenarioDescriptions[scenario],
    values: scenario === "requested" ? {} : { props: { scenario } },
    testId: `artifact-review-${scenario}`,
  })),
  controls: [...environmentControlsFor(defaults)],
  render: (state, context) => <ArtifactReviewFixture scenario={state.props.scenario} emit={context.emit} />,
  generateCode: (state) => {
    const typed = state.environment.language === "tsx";
    const artifact = JSON.stringify(codeArtifact(state.props.scenario), null, 2);
    const change = JSON.stringify(codeChange(state.props.scenario), null, 2);
    const offline = state.props.scenario === "offline";
    const submitting = state.props.scenario === "submitting";
    return [
      ...(typed ? ['import type { Artifact } from "@aifrontkit/core";'] : []),
      `import { ArtifactReview${typed ? ", type ArtifactChange, type ArtifactChangesRequest, type ArtifactReviewDecision" : ""} } from "@/components/aifrontkit/artifact-review";`,
      "",
      `const artifact${typed ? ": Artifact" : ""} = ${artifact};`,
      `const change${typed ? ": ArtifactChange" : ""} = ${change};`,
      "",
      ...(typed ? [
        "interface RuntimePatchReviewProps {",
        "  onAccept(decision: ArtifactReviewDecision): void;",
        "  onRequestChanges(request: ArtifactChangesRequest): void;",
        "  onRetry(): void;",
        "  onReviewLatest(artifactId: string): void;",
        "}",
        "",
      ] : []),
      `export function RuntimePatchReview({ onAccept, onRequestChanges, onRetry, onReviewLatest }${typed ? ": RuntimePatchReviewProps" : ""}) {`,
      "  return (",
      "    <ArtifactReview",
      "      artifact={artifact}",
      "      change={change}",
      ...(offline ? ["      offline"] : []),
      ...(offline ? ['      initialFeedback="Please keep the reconnect timeout configurable."', "      initialFeedbackOpen"] : []),
      ...(submitting ? ["      decisionPending"] : []),
      "      onAccept={onAccept}",
      "      onRequestChanges={onRequestChanges}",
      "      onRetry={onRetry}",
      "      onReviewLatest={onReviewLatest}",
      "    />",
      "  );",
      "}",
    ].join("\n");
  },
});
