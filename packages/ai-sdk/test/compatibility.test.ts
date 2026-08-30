import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createAISDKAdapter, type AISDKUIStreamPart } from "../src/index.js";

interface CompatibilityFixture {
  fixtureSchemaVersion: number;
  upstream: { package: string; version: string; protocol: string; capturedAt: string; source: string };
  scenarios: Array<{ name: string; parts: AISDKUIStreamPart[]; expectedTypes: string[] }>;
}

const fixture = JSON.parse(readFileSync(new URL("../../../compatibility/fixtures/adapters/ai-sdk-7.0.85/ui-message-stream.json", import.meta.url), "utf8")) as CompatibilityFixture;

describe(`AI SDK ${fixture.upstream.version} compatibility`, () => {
  it("pins the reviewed package and protocol", () => {
    expect(fixture).toMatchObject({ fixtureSchemaVersion: 1 });
    expect(fixture.upstream).toEqual({ package: "ai", version: "7.0.85", protocol: "UI message stream v1", capturedAt: "2026-08-30", source: "https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol" });
  });

  for (const scenario of fixture.scenarios) {
    it(scenario.name, () => {
      const adapter = createAISDKAdapter({ threadId: "thread-1", messageId: "fallback", now: () => 1 });
      const events = scenario.parts.flatMap((part) => adapter.adapt(part));
      expect(events.map((event) => event.type)).toEqual(scenario.expectedTypes);
    });
  }
});
