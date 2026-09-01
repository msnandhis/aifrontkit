import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAISDKAdapter, type AISDKUIStreamPart } from "../src/ai-sdk/index.js";

interface CompatibilityFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  scenarios: Array<{ name: string; parts: AISDKUIStreamPart[]; expectedTypes: string[] }>;
}

const fixtures = ["6.0.272", "7.0.85"].map((version) => JSON.parse(readFileSync(new URL(`../../../compatibility/fixtures/adapters/ai-sdk-${version}/ui-message-stream.json`, import.meta.url), "utf8")) as CompatibilityFixture);

for (const fixture of fixtures) {
  describe(`AI SDK ${fixture.upstream.version} compatibility`, () => {
    it("pins the reviewed package and protocol", () => {
      expect(fixture).toMatchObject({ fixtureSchemaVersion: 1, upstream: { package: "ai", protocol: "UI message stream v1" } });
    });

    for (const scenario of fixture.scenarios) {
      it(scenario.name, () => {
        const adapter = createAISDKAdapter({ threadId: "thread-1", messageId: "fallback", now: () => 1 });
        const events = scenario.parts.flatMap((part) => adapter.adapt(part));
        expect(events.map((event) => event.type)).toEqual(scenario.expectedTypes);
        expect(events.every((event) => event.schemaVersion === 4)).toBe(true);
      });
    }
  });
}
