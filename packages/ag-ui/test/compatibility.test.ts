import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAGUIAdapter, type AGUIEvent } from "../src/index.js";

interface CompatibilityFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  scenarios: Array<{ name: string; events: AGUIEvent[]; expectedTypes: string[] }>;
}

const fixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/ag-ui-core-0.0.59/events.json", import.meta.url), "utf8")) as CompatibilityFixture;

describe(`AG-UI ${fixture.upstream.version} compatibility`, () => {
  it("pins the reviewed package and protocol", () => {
    expect(fixture).toMatchObject({ fixtureSchemaVersion: 1 });
    expect(fixture.upstream).toEqual({ package: "@ag-ui/core", version: "0.0.59", protocol: "AG-UI event stream", capturedAt: "2026-08-30", source: "https://docs.ag-ui.com/sdk/js/core/events" });
  });

  for (const scenario of fixture.scenarios) {
    it(scenario.name, () => {
      const adapter = createAGUIAdapter({ threadId: "thread-1", now: () => 1 });
      const events = scenario.events.flatMap((event) => adapter.adapt(event));
      expect(events.map((event) => event.type)).toEqual(scenario.expectedTypes);
      expect(events.every((event) => event.schemaVersion === 4)).toBe(true);

      if (scenario.name.startsWith("repeated step")) {
        const startedSteps = events.filter((event) => event.type === "task.step.updated" && event.step.status === "running");
        expect(startedSteps).toHaveLength(2);
        expect(startedSteps[0]?.type === "task.step.updated" && startedSteps[0].step.id).not.toBe(startedSteps[1]?.type === "task.step.updated" ? startedSteps[1].step.id : undefined);
      }
    });
  }
});
