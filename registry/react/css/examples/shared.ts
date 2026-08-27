import type {
  PlaygroundControl,
  PlaygroundEnvironment,
  PlaygroundRecord,
  PlaygroundState,
} from "@aifrontkit/testing";

/** React/CSS example defaults. Framework-neutral types live in testing. */
export const exampleEnvironmentDefaults: PlaygroundEnvironment = {
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
  { scope: "environment", key: "framework", label: "Framework", type: "segmented", group: "Advanced", options: [{ label: "React", value: "react" }, { label: "Next.js", value: "next" }] },
  { scope: "environment", key: "language", label: "Language", type: "segmented", group: "Advanced", options: [{ label: "TSX", value: "tsx" }, { label: "JSX", value: "jsx" }] },
  { scope: "environment", key: "viewport", label: "Viewport", type: "segmented", group: "Advanced", options: [{ label: "Responsive", value: "responsive" }, { label: "Tablet", value: "tablet" }, { label: "Mobile", value: "mobile" }] },
  { scope: "environment", key: "direction", label: "Reading direction", type: "segmented", group: "Advanced", options: [{ label: "Left to right", value: "ltr" }, { label: "Right to left", value: "rtl" }] },
  { scope: "environment", key: "motion", label: "Motion", type: "segmented", group: "Appearance", options: [{ label: "None", value: "none" }, { label: "Subtle", value: "subtle" }, { label: "Expressive", value: "expressive" }] },
];

/** Keep shared controls typed to the owning component definition. */
export function exampleEnvironmentControlsFor<Props extends PlaygroundRecord>(
  _defaults: PlaygroundState<Props, PlaygroundEnvironment>,
): readonly PlaygroundControl<Props, PlaygroundEnvironment>[] {
  return sharedEnvironmentControls as readonly PlaygroundControl<Props, PlaygroundEnvironment>[];
}

export function quote(value: string) {
  return JSON.stringify(value);
}
