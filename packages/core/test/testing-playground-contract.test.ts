import { describe, expect, expectTypeOf, it } from "vitest";

import {
  createPlaygroundCoordinates,
  definePlaygroundDefinition,
  type PlaygroundEnvironment,
  type PlaygroundRecord,
  type PlaygroundState,
} from "../src/testing/index.js";

interface CounterProps extends PlaygroundRecord {
  count: number;
  label: string;
}

interface CounterEnvironment extends PlaygroundEnvironment {
  density: "comfortable" | "compact";
}

const defaults: PlaygroundState<CounterProps, CounterEnvironment> = {
  props: { count: 1, label: "Count" },
  environment: {
    theme: "light",
    style: "css-modules",
    framework: "react",
    language: "tsx",
    viewport: "responsive",
    direction: "ltr",
    motion: "subtle",
    density: "comfortable",
  },
};

describe("canonical playground contract", () => {
  it("normalizes legacy presets while preserving scenario and definition versions", () => {
    const definition = definePlaygroundDefinition<"counter", CounterProps, CounterEnvironment, string, { readonly prefix: string }>({
      id: "counter",
      version: "2.1.0",
      label: "Counter",
      description: "A framework-neutral example.",
      defaults,
      presets: [{
        id: "compact",
        version: "1.4.0",
        label: "Compact",
        description: "A compact rendering environment.",
        values: { environment: { density: "compact" } },
        testId: "counter-compact",
      }],
      controls: [{
        scope: "props",
        key: "count",
        label: "Count",
        group: "Content",
        type: "range",
        min: 0,
        max: 10,
      }],
      render: (state, context) => `${context.prefix}${state.props.label}: ${state.props.count}`,
      generateCode: (state) => `counter(${state.props.count})`,
    });

    expect(definition.version).toBe("2.1.0");
    expect(definition.scenarios).toHaveLength(1);
    expect(definition.scenarios[0]).toMatchObject({ id: "compact", version: "1.4.0", testId: "counter-compact" });
    expect(definition.presets).toBe(definition.scenarios);
    expect(definition.render(defaults, { prefix: "Preview: " })).toBe("Preview: Count: 1");
    expectTypeOf(definition.render(defaults, { prefix: "Preview: " })).toEqualTypeOf<string>();
  });

  it("generates stable coordinates when an adapter does not provide them", () => {
    const coordinates = createPlaygroundCoordinates("counter");

    expect(coordinates.root).toBe('[data-playground-id="counter"]');
    expect(coordinates.preview).toBe('[data-playground-id="counter"] [data-playground-preview]');
    expect(coordinates.control("environment", "theme")).toBe('[data-playground-id="counter"] [data-playground-control="environment.theme"]');
    expect(coordinates.scenario("compact")).toBe('[data-playground-id="counter"] [data-playground-scenario="compact"]');
  });
});
