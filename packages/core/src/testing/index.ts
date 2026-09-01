import type { AIFrontEvent } from "../events/index.js";

/**
 * Values that can safely cross a URL, clipboard, fixture, or framework
 * boundary. Component-specific data belongs in the adapter layer instead.
 */
export type PlaygroundValue = string | number | boolean;

/** Partial scenario overlays may omit keys; complete defaults supply them. */
export type PlaygroundRecord = Record<string, PlaygroundValue | undefined>;

export type PlaygroundTheme = "light" | "dark";
export type PlaygroundStyle = "css-modules" | "tailwind";
export type PlaygroundFramework = "react" | "next";
export type PlaygroundLanguage = "tsx" | "jsx";
export type PlaygroundViewport = "responsive" | "mobile" | "tablet";
export type PlaygroundDirection = "ltr" | "rtl";
export type PlaygroundMotion = "none" | "subtle" | "expressive";

/**
 * Rendering concerns are separate from component props. This keeps examples
 * replayable in another framework host without changing the component API.
 */
export interface PlaygroundEnvironment extends PlaygroundRecord {
  theme: PlaygroundTheme;
  style: PlaygroundStyle;
  framework: PlaygroundFramework;
  language: PlaygroundLanguage;
  viewport: PlaygroundViewport;
  direction: PlaygroundDirection;
  motion: PlaygroundMotion;
}

export interface PlaygroundState<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> {
  props: Props;
  environment: Environment;
}

export type PartialPlaygroundState<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = {
  props?: Partial<Props>;
  environment?: Partial<Environment>;
};

export type PlaygroundControlGroup = "Content" | "Appearance" | "Behavior" | "Slots" | "Advanced";
export type PlaygroundControlScope = "props" | "environment";

interface PlaygroundControlPresentation<
  Props extends PlaygroundRecord,
  Environment extends PlaygroundRecord,
> {
  label: string;
  description?: string;
  group: PlaygroundControlGroup;
  visible?(state: PlaygroundState<Props, Environment>): boolean;
}

type ScopedPlaygroundControl<
  Shape,
  Props extends PlaygroundRecord,
  Environment extends PlaygroundRecord,
> =
  | (Shape & { scope: "props"; key: Extract<keyof Props, string> })
  | (Shape & { scope: "environment"; key: Extract<keyof Environment, string> });

interface SelectPlaygroundControlShape<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> extends PlaygroundControlPresentation<Props, Environment> {
  type: "select" | "segmented";
  options: readonly { label: string; value: string }[];
}

export type SelectPlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = ScopedPlaygroundControl<SelectPlaygroundControlShape<Props, Environment>, Props, Environment>;

interface BooleanPlaygroundControlShape<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> extends PlaygroundControlPresentation<Props, Environment> {
  type: "boolean";
}

export type BooleanPlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = ScopedPlaygroundControl<BooleanPlaygroundControlShape<Props, Environment>, Props, Environment>;

interface TextPlaygroundControlShape<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> extends PlaygroundControlPresentation<Props, Environment> {
  type: "text" | "textarea";
  placeholder?: string;
}

export type TextPlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = ScopedPlaygroundControl<TextPlaygroundControlShape<Props, Environment>, Props, Environment>;

interface RangePlaygroundControlShape<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> extends PlaygroundControlPresentation<Props, Environment> {
  type: "range";
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export type RangePlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = ScopedPlaygroundControl<RangePlaygroundControlShape<Props, Environment>, Props, Environment>;

export type PlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> =
  | SelectPlaygroundControl<Props, Environment>
  | BooleanPlaygroundControl<Props, Environment>
  | TextPlaygroundControl<Props, Environment>
  | RangePlaygroundControl<Props, Environment>;

/** Serializable scenario metadata. `version` is independent from npm versions. */
export interface PlaygroundScenario<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> {
  id: string;
  version: string;
  label: string;
  description: string;
  values: PartialPlaygroundState<Props, Environment>;
  /** Stable coordinate used by visual and interaction fixtures. */
  testId?: string;
}

/** Compatibility name for consumers that previously called scenarios presets. */
export type PlaygroundPreset<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
> = PlaygroundScenario<Props, Environment>;

/** Stable selectors let browser tests target an example without display text. */
export interface PlaygroundTestCoordinates {
  root: string;
  preview: string;
  code: string;
  control(scope: PlaygroundControlScope, key: string): string;
  scenario(id: string): string;
}

/**
 * Framework-neutral canonical example contract. `RenderResult` intentionally
 * defaults to unknown: React, Web Components, Vue, and test hosts each supply
 * their own render result and context without this package taking a UI runtime
 * dependency.
 */
export interface PlaygroundDefinition<
  Id extends string = string,
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
  RenderResult = unknown,
  RenderContext = unknown,
> {
  id: Id;
  /** Version of the serializable example contract, independent from package versions. */
  version: string;
  label: string;
  description: string;
  defaults: PlaygroundState<Props, Environment>;
  scenarios: readonly PlaygroundScenario<Props, Environment>[];
  /** Compatibility alias; new consumers should use `scenarios`. */
  presets: readonly PlaygroundScenario<Props, Environment>[];
  controls: readonly PlaygroundControl<Props, Environment>[];
  coordinates: PlaygroundTestCoordinates;
  render(state: PlaygroundState<Props, Environment>, context: RenderContext): RenderResult;
  generateCode(state: PlaygroundState<Props, Environment>): string;
}

export type PlaygroundDefinitionInput<
  Id extends string = string,
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
  RenderResult = unknown,
  RenderContext = unknown,
> = Omit<PlaygroundDefinition<Id, Props, Environment, RenderResult, RenderContext>, "scenarios" | "presets" | "coordinates"> & {
  scenarios?: readonly PlaygroundScenario<Props, Environment>[];
  presets?: readonly PlaygroundScenario<Props, Environment>[];
  coordinates?: PlaygroundTestCoordinates;
};

export function createPlaygroundCoordinates(id: string): PlaygroundTestCoordinates {
  const root = `[data-playground-id="${id}"]`;
  return {
    root,
    preview: `${root} [data-playground-preview]`,
    code: `${root} [data-playground-code]`,
    control: (scope, key) => `${root} [data-playground-control="${scope}.${key}"]`,
    scenario: (scenarioId) => `${root} [data-playground-scenario="${scenarioId}"]`,
  };
}

/**
 * Normalizes the legacy preset name and attaches stable test coordinates once,
 * so controls, preview, generated code, and test fixtures share one definition.
 */
export function definePlaygroundDefinition<
  Id extends string,
  Props extends PlaygroundRecord,
  Environment extends PlaygroundRecord = PlaygroundEnvironment,
  RenderResult = unknown,
  RenderContext = unknown,
>(definition: PlaygroundDefinitionInput<Id, Props, Environment, RenderResult, RenderContext>): PlaygroundDefinition<Id, Props, Environment, RenderResult, RenderContext> {
  const scenarios = definition.scenarios ?? definition.presets ?? [];
  const coordinates = definition.coordinates ?? createPlaygroundCoordinates(definition.id);

  return {
    ...definition,
    scenarios,
    presets: scenarios,
    coordinates,
  };
}

export function conversationFixture(threadId = "fixture-thread"): readonly AIFrontEvent[] {
  return [
    { schemaVersion: 1, id: "fixture-1", threadId, timestamp: 1, type: "message.started", messageId: "assistant-1", role: "assistant" },
    { schemaVersion: 1, id: "fixture-2", threadId, timestamp: 2, type: "message.delta", messageId: "assistant-1", delta: "Deterministic fixture" },
    { schemaVersion: 1, id: "fixture-3", threadId, timestamp: 3, type: "message.completed", messageId: "assistant-1" }
  ];
}

export const supportedSchemaMajors = [1] as const;

/**
 * Rendering environments shared by component tests, documentation examples,
 * and visual-regression tooling. Keeping these values finite makes the
 * component quality matrix deterministic instead of allowing one-off flags.
 */
export const componentFixtureThemes = ["light", "dark", "high-contrast"] as const;
export const componentFixtureDirections = ["ltr", "rtl"] as const;
export const componentFixtureDensities = ["comfortable", "compact"] as const;

export type ComponentFixtureTheme = (typeof componentFixtureThemes)[number];
export type ComponentFixtureDirection = (typeof componentFixtureDirections)[number];
export type ComponentFixtureDensity = (typeof componentFixtureDensities)[number];

export interface ComponentFixtureEnvironment {
  readonly theme?: ComponentFixtureTheme;
  readonly direction?: ComponentFixtureDirection;
  readonly density?: ComponentFixtureDensity;
  readonly reducedMotion?: boolean;
  readonly viewport?: Readonly<{
    width: number;
    height: number;
  }>;
  readonly locale?: string;
  readonly zoom?: 1 | 2;
}

export interface ComponentFixtureDefinition<Props = unknown> {
  /** Stable kebab-case identifier referenced by component.json. */
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: "core" | "state" | "stress" | "accessibility" | "responsive";
  readonly environment?: ComponentFixtureEnvironment;
  readonly props: Props;
}

/**
 * Preserves literal fixture identifiers while rejecting duplicates at module
 * initialization, so test and documentation selectors never become ambiguous.
 */
export function defineComponentFixtures<
  const Fixture extends ComponentFixtureDefinition,
>(fixtures: readonly Fixture[]): readonly Fixture[] {
  const identifiers = new Set<string>();

  for (const fixture of fixtures) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(fixture.id)) {
      throw new Error(`Component fixture id '${fixture.id}' must be kebab-case.`);
    }
    if (identifiers.has(fixture.id)) {
      throw new Error(`Duplicate component fixture id '${fixture.id}'.`);
    }
    identifiers.add(fixture.id);
  }

  return Object.freeze([...fixtures]);
}

export function componentFixtureIds(
  fixtures: readonly ComponentFixtureDefinition<unknown>[],
): readonly string[] {
  return fixtures.map((fixture) => fixture.id);
}
