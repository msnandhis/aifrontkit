import type { AIFrontEvent } from "@aifrontkit/core";

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
