import type { ReactNode } from "react";

export type PlaygroundValue = string | number | boolean;
export type PlaygroundState = Record<string, PlaygroundValue>;
export type PlaygroundControlGroup = "Content" | "Appearance" | "Behavior" | "Slots" | "Advanced";

interface ControlBase<State extends PlaygroundState> {
  key: Extract<keyof State, string>;
  label: string;
  description?: string;
  group: PlaygroundControlGroup;
  visible?(state: State): boolean;
}

export interface SelectControl<State extends PlaygroundState> extends ControlBase<State> {
  type: "select" | "segmented";
  options: readonly { label: string; value: string }[];
}

export interface BooleanControl<State extends PlaygroundState> extends ControlBase<State> {
  type: "boolean";
}

export interface TextControl<State extends PlaygroundState> extends ControlBase<State> {
  type: "text" | "textarea";
  placeholder?: string;
}

export interface RangeControl<State extends PlaygroundState> extends ControlBase<State> {
  type: "range";
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export type PlaygroundControl<State extends PlaygroundState> =
  | SelectControl<State>
  | BooleanControl<State>
  | TextControl<State>
  | RangeControl<State>;

export interface PlaygroundPreset<State extends PlaygroundState> {
  id: string;
  label: string;
  description: string;
  values: Partial<State>;
}

export interface PlaygroundRenderContext {
  emit(message: string): void;
}

export interface PlaygroundDefinition<State extends PlaygroundState = PlaygroundState> {
  id: ComponentName;
  label: string;
  description: string;
  defaults: State;
  presets: readonly PlaygroundPreset<State>[];
  controls: readonly PlaygroundControl<State>[];
  render(state: State, context: PlaygroundRenderContext): ReactNode;
  generateCode(state: State): string;
}

export type AnyPlaygroundDefinition = PlaygroundDefinition<PlaygroundState>;
export type ComponentName = "conversation" | "message" | "prompt-input" | "file" | "tool-call";
export type PlaygroundView = "preview" | "code";
export type PreviewWidth = "responsive" | "mobile" | "tablet";

export function definePlayground<State extends PlaygroundState>(definition: PlaygroundDefinition<State>) {
  return definition;
}

export const controlGroups: readonly PlaygroundControlGroup[] = ["Content", "Appearance", "Behavior", "Slots", "Advanced"];
