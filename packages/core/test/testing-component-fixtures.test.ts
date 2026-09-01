import { describe, expect, it } from "vitest";

import {
  componentFixtureIds,
  defineComponentFixtures,
} from "../src/testing/index.js";

describe("component fixtures", () => {
  it("preserves deterministic literal fixtures", () => {
    const fixtures = defineComponentFixtures([
      {
        id: "default",
        title: "Default",
        description: "The primary component state.",
        category: "core",
        props: { value: "Hello" },
      },
      {
        id: "long-content",
        title: "Long content",
        description: "A content stress state.",
        category: "stress",
        environment: { viewport: { width: 375, height: 812 } },
        props: { value: "Long" },
      },
    ]);

    expect(componentFixtureIds(fixtures)).toEqual(["default", "long-content"]);
    expect(Object.isFrozen(fixtures)).toBe(true);
  });

  it("rejects duplicate and non-kebab-case identifiers", () => {
    const base = {
      title: "Fixture",
      description: "Fixture description.",
      category: "core" as const,
      props: {},
    };

    expect(() => defineComponentFixtures([
      { ...base, id: "default" },
      { ...base, id: "default" },
    ])).toThrow("Duplicate component fixture id 'default'.");

    expect(() => defineComponentFixtures([
      { ...base, id: "Long content" },
    ])).toThrow("must be kebab-case");
  });
});
