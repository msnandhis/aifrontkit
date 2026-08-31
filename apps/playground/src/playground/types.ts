import type { ReactNode } from "react";
import {
  createPlaygroundCoordinates as createCanonicalPlaygroundCoordinates,
  definePlaygroundDefinition,
} from "@aifrontkit/testing";
import type {
  PlaygroundControl as CanonicalPlaygroundControl,
  PlaygroundControlGroup,
  PlaygroundControlScope,
  PlaygroundDefinition as CanonicalPlaygroundDefinition,
  PlaygroundDefinitionInput,
  PlaygroundEnvironment,
  PlaygroundLanguage,
  PlaygroundMotion,
  PlaygroundRecord,
  PlaygroundScenario,
  PlaygroundState,
  PlaygroundStyle,
  PlaygroundTheme,
  PlaygroundDirection,
  PlaygroundTestCoordinates,
  PlaygroundValue,
  PartialPlaygroundState,
  SelectPlaygroundControl,
  BooleanPlaygroundControl,
  TextPlaygroundControl,
  RangePlaygroundControl,
} from "@aifrontkit/testing";

export {
  type BooleanPlaygroundControl as BooleanControl,
  type PlaygroundControlGroup,
  type PlaygroundControlScope,
  type PlaygroundDirection,
  type PlaygroundEnvironment,
  type PlaygroundLanguage,
  type PlaygroundMotion,
  type PlaygroundRecord,
  type PlaygroundScenario,
  type PlaygroundStyle,
  type PlaygroundTestCoordinates,
  type PlaygroundTheme,
  type PlaygroundValue,
  type PlaygroundState,
  type PartialPlaygroundState,
  type RangePlaygroundControl as RangeControl,
  type SelectPlaygroundControl as SelectControl,
  type TextPlaygroundControl as TextControl,
};

export type ComponentName =
  | "conversation"
  | "message"
  | "prompt-input"
  | "file"
  | "tool-call"
  | "attachment-composer"
  | "agent-progress"
  | "tool-approval"
  | "artifact-review"
  | "research-agent";
export type PlaygroundView = "preview" | "code";
export type PreviewWidth = PlaygroundEnvironment["viewport"];
export type PlaygroundFramework = PlaygroundEnvironment["framework"];
export type PlaygroundControl<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundEnvironment = PlaygroundEnvironment,
> = CanonicalPlaygroundControl<Props, Environment>;

/** Legacy name retained for integrations that called scenarios “presets”. */
export type PlaygroundPreset<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundEnvironment = PlaygroundEnvironment,
> = PlaygroundScenario<Props, Environment>;

export interface PlaygroundRenderContext {
  emit(message: string): void;
  setProp(key: string, value: PlaygroundRecord[string]): void;
}

export type PlaygroundDefinition<
  Props extends PlaygroundRecord = PlaygroundRecord,
  Environment extends PlaygroundEnvironment = PlaygroundEnvironment,
> = CanonicalPlaygroundDefinition<ComponentName, Props, Environment, ReactNode, PlaygroundRenderContext>;

export type AnyPlaygroundDefinition = PlaygroundDefinition<PlaygroundRecord, PlaygroundEnvironment>;

/** Shared environment controls make every playground honest about its host axes. */
export const environmentDefaults: PlaygroundEnvironment = {
  theme: "light",
  style: "css-modules",
  framework: "react",
  language: "tsx",
  viewport: "responsive",
  direction: "ltr",
  motion: "subtle",
};

const sharedEnvironmentControls: readonly PlaygroundControl[] = [
  { scope: "environment", key: "theme", label: "Theme", type: "segmented", group: "Appearance", options: [{ label: "Light", value: "light" }, { label: "Dark", value: "dark" }] },
  // Styling becomes selectable only after both flavors render the same API and
  // pass screenshot parity. Until then, the honest environment is CSS Modules.
  { scope: "environment", key: "framework", label: "Framework", type: "segmented", group: "Advanced", options: [{ label: "React", value: "react" }, { label: "Next.js", value: "next" }] },
  { scope: "environment", key: "language", label: "Language", type: "segmented", group: "Advanced", options: [{ label: "TSX", value: "tsx" }, { label: "JSX", value: "jsx" }] },
  { scope: "environment", key: "viewport", label: "Viewport", type: "segmented", group: "Advanced", options: [{ label: "Responsive", value: "responsive" }, { label: "Tablet", value: "tablet" }, { label: "Mobile", value: "mobile" }] },
  { scope: "environment", key: "direction", label: "Reading direction", type: "segmented", group: "Advanced", options: [{ label: "Left to right", value: "ltr" }, { label: "Right to left", value: "rtl" }] },
  { scope: "environment", key: "motion", label: "Motion", type: "segmented", group: "Appearance", options: [{ label: "None", value: "none" }, { label: "Subtle", value: "subtle" }, { label: "Expressive", value: "expressive" }] },
];

/** Preserve the owning definition's prop type when composing shared controls. */
export function environmentControlsFor<
  Props extends PlaygroundRecord,
  Environment extends PlaygroundEnvironment,
>(_defaults: PlaygroundState<Props, Environment>): readonly PlaygroundControl<Props, Environment>[] {
  return sharedEnvironmentControls as readonly PlaygroundControl<Props, Environment>[];
}

export const controlGroups: readonly PlaygroundControlGroup[] = ["Content", "Appearance", "Behavior", "Slots", "Advanced"];

export function createPlaygroundCoordinates(id: ComponentName): PlaygroundTestCoordinates {
  return createCanonicalPlaygroundCoordinates(id);
}

export function definePlayground<
  Props extends PlaygroundRecord,
  Environment extends PlaygroundEnvironment = PlaygroundEnvironment,
>(definition: Omit<PlaygroundDefinition<Props, Environment>, "presets" | "coordinates"> & { presets?: readonly PlaygroundScenario<Props, Environment>[]; coordinates?: PlaygroundTestCoordinates }) {
  return definePlaygroundDefinition(
    definition as PlaygroundDefinitionInput<ComponentName, Props, Environment, ReactNode, PlaygroundRenderContext>,
  );
}
