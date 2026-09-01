import { createRuntime, type AIFrontEvent } from "@aifrontkit/core";
import { AIFrontKitProvider } from "@aifrontkit/react";
import { defineComponentFixtures } from "@aifrontkit/core/testing";
import { ToolCall } from "./tool-call.js";

export const toolCallQualityScenarios = [
  { id: "default", expectation: "Pending tool call exposes its name and lifecycle status." },
  { id: "pending", expectation: "Queued work is distinguishable without implying execution." },
  { id: "running", expectation: "Active work exposes busy state and restrained progress." },
  { id: "complete", expectation: "Structured output remains readable and bounded." },
  { id: "failed", expectation: "Failure meaning remains attached to the tool output." },
  { id: "cancelled", expectation: "Cancelled work remains understandable without an error alarm." },
] as const;
export type ToolCallFixtureId = (typeof toolCallQualityScenarios)[number]["id"];

/** Compatibility catalog for fixture consumers that use the shared testing package. */
export const toolCallFixtures = defineComponentFixtures([
  { id: "default", title: "Default", description: "Pending tool call.", category: "core", props: { status: "pending" } },
  { id: "pending", title: "Pending", description: "Tool is queued.", category: "state", props: { status: "pending" } },
  { id: "running", title: "Running", description: "Tool is active.", category: "state", props: { status: "running" } },
  { id: "complete", title: "Complete", description: "Structured output is available.", category: "state", props: { status: "complete" } },
  { id: "failed", title: "Failed", description: "Tool returned an actionable failure.", category: "state", props: { status: "failed" } },
  { id: "cancelled", title: "Cancelled", description: "Tool was stopped.", category: "state", props: { status: "cancelled" } }
]);

export function ToolCallFixture({ scenario = "default" }: { scenario?: ToolCallFixtureId }) {
  const status = scenario === "default" ? "pending" : scenario;
  const event: AIFrontEvent = {
    schemaVersion: 1,
    id: `tool-${status}`,
    threadId: "tool-fixture",
    timestamp: 1,
    type: "tool.updated",
    toolCallId: "tool-1",
    name: "search_documentation",
    status,
    ...(status === "complete" ? { output: { matches: 4, source: "community registry" } } : {}),
    ...(status === "failed" ? { error: "The documentation index is unavailable. Retry the search." } : {})
  };
  const runtime = createRuntime("tool-fixture", [event]);
  return <AIFrontKitProvider runtime={runtime}><div data-fixture-component="tool-call" data-fixture-scenario={scenario}><ToolCall toolCallId="tool-1" actions={<button type="button" aria-label="Tool options">•••</button>} /></div></AIFrontKitProvider>;
}
