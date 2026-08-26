import { describe, expect, it } from "vitest";
import { fixtureList, fixtureMap } from "./fixtures.js";
import { componentFixtureContracts, componentFixtureIds } from "./component-fixtures.js";

describe("Component Lab fixtures", () => {
  it("keeps fixture ids unique and review order deterministic", () => {
    expect(fixtureList.map((fixture) => fixture.id)).toEqual(["default", "empty", "streaming", "interrupted", "failed", "long-content", "mixed-roles", "rtl", "localization"]);
    expect(new Set(fixtureList.map((fixture) => fixture.id)).size).toBe(fixtureList.length);
  });

  it("represents the required conversation states", () => {
    expect(fixtureMap.empty.runtime.getState().messageOrder).toHaveLength(0);
    expect(fixtureMap.streaming.runtime.getState().messages["assistant-1"]?.status).toBe("streaming");
    expect(fixtureMap.interrupted.runtime.getState().messages["assistant-1"]?.status).toBe("interrupted");
    expect(fixtureMap.failed.runtime.getState().messages["assistant-1"]?.status).toBe("failed");
    expect(fixtureMap["long-content"].runtime.getState().messageOrder).toHaveLength(4);
    expect(fixtureMap["mixed-roles"].runtime.getState().messages["system-1"]?.role).toBe("system");
    expect(fixtureMap.rtl.runtime.getState().messages["user-1"]?.parts[0]).toMatchObject({ type: "text" });
  });

  it("keeps every declared registry component renderable in the lab", () => {
    expect(componentFixtureIds).toEqual(["conversation", "message", "prompt-input", "tool-call"]);
    expect(componentFixtureContracts.every((contract) => contract.scenarios.some((scenario) => scenario.id === "default"))).toBe(true);
  });
});
