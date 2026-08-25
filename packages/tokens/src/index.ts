/**
 * Framework-neutral design tokens for AIFrontKit.
 *
 * The package deliberately contains no DOM, React, or CSS-in-JS code. It
 * provides a serialisable theme contract and a CSS variable projection that
 * any renderer can consume.
 */

export const themeSchemaVersion = 1 as const;

export const themeModes = ["light", "dark", "high-contrast"] as const;
export type ThemeMode = (typeof themeModes)[number];

export const themeTemperatures = ["neutral", "warm", "cool"] as const;
export type ThemeTemperature = (typeof themeTemperatures)[number];

export const densityNames = ["compact", "comfortable", "spacious"] as const;
export type Density = (typeof densityNames)[number];

export const radiusNames = ["none", "small", "medium", "large", "full"] as const;
export type Radius = (typeof radiusNames)[number];

export const motionLevels = ["none", "subtle", "expressive"] as const;
export type MotionLevel = (typeof motionLevels)[number];

export const durationNames = ["instant", "fast", "normal", "slow"] as const;
export type DurationName = (typeof durationNames)[number];

export const easingNames = ["linear", "standard", "enter", "exit", "emphasis"] as const;
export type EasingName = (typeof easingNames)[number];

export const motionRecipeNames = [
  "messageEntry",
  "streamActivity",
  "panelTransition",
  "artifactUpdate",
  "toolProgress",
  "approvalAttention"
] as const;
export type MotionRecipeName = (typeof motionRecipeNames)[number];

/** Semantic color token names. Keep these names about intent, not components. */
export const tokenNames = [
  "canvas", "surface", "surfaceElevated", "surfaceSubtle", "text", "textMuted", "textSubtle",
  "border", "borderStrong", "accent", "accentForeground", "accentMuted", "focus", "selection",
  "input", "inputBorder", "disabled", "disabledForeground", "destructive", "destructiveForeground",
  "success", "successForeground", "warning", "warningForeground", "info", "infoForeground",
  "assistantSurface", "userSurface", "toolSurface", "reasoningSurface", "approvalSurface", "artifactSurface"
] as const;
export type TokenName = (typeof tokenNames)[number];
export type ThemeTokens = Record<TokenName, string>;

export type AccentName = "indigo" | "blue" | "teal" | "violet" | "rose" | "amber";

export interface TypographyTokens {
  fontFamilySans: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;
  lineHeightTight: string;
  lineHeightNormal: string;
  lineHeightRelaxed: string;
  fontWeightNormal: number;
  fontWeightMedium: number;
  fontWeightSemibold: number;
  fontWeightBold: number;
  letterSpacingTight: string;
  letterSpacingNormal: string;
  letterSpacingWide: string;
}

export interface SpacingTokens {
  space0: string;
  space1: string;
  space2: string;
  space3: string;
  space4: string;
  space5: string;
  space6: string;
  space7: string;
  space8: string;
  contentGap: string;
  sectionGap: string;
  controlHeightSm: string;
  controlHeight: string;
  controlHeightLg: string;
  touchTarget: string;
}

export interface RadiusTokens {
  none: string;
  small: string;
  medium: string;
  large: string;
  full: string;
  control: string;
  panel: string;
  pill: string;
}

export interface ShadowTokens {
  none: string;
  sm: string;
  md: string;
  lg: string;
  focus: string;
}

export interface MotionRecipe {
  duration: DurationName;
  easing: EasingName;
  distance: number;
  scale: number;
  opacity: number;
  stagger: number;
}

export interface ResolvedMotionRecipe extends MotionRecipe {
  durationValue: string;
  easingValue: string;
  distanceValue: string;
  staggerValue: string;
  reduced: {
    durationValue: "0ms";
    easingValue: "linear";
    distanceValue: "0px";
    scale: 1;
    opacity: 1;
    staggerValue: "0ms";
  };
}

export interface MotionTokens {
  level: MotionLevel;
  durations: Record<DurationName, string>;
  easings: Record<EasingName, string>;
  distance: number;
  scale: number;
  opacity: number;
  stagger: number;
  recipes: Record<MotionRecipeName, ResolvedMotionRecipe>;
}

export interface MotionOptions {
  level?: MotionLevel;
  durations?: Partial<Record<DurationName, string>>;
  easings?: Partial<Record<EasingName, string>>;
  distance?: number;
  scale?: number;
  opacity?: number;
  stagger?: number;
  recipes?: Partial<Record<MotionRecipeName, Partial<MotionRecipe>>>;
}

export interface ThemeOptions {
  mode?: ThemeMode;
  temperature?: ThemeTemperature;
  density?: Density;
  radius?: Radius;
  accent?: AccentName;
  tokens?: Partial<ThemeTokens>;
  typography?: Partial<TypographyTokens>;
  spacing?: Partial<SpacingTokens>;
  shadows?: Partial<ShadowTokens>;
  motion?: MotionOptions;
}

/** Alias used by providers and persisted theme documents. */
export type ThemeConfig = ThemeOptions;

export interface ResolvedTheme {
  schemaVersion: typeof themeSchemaVersion;
  mode: ThemeMode;
  temperature: ThemeTemperature;
  density: Density;
  radius: Radius;
  accent: AccentName;
  tokens: ThemeTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radii: RadiusTokens;
  shadows: ShadowTokens;
  motion: MotionTokens;
}

export type ThemeAttributeMap = {
  "data-aifk-theme": ThemeMode;
  "data-aifk-temperature": ThemeTemperature;
  "data-aifk-density": Density;
  "data-aifk-radius": Radius;
  "data-aifk-motion": MotionLevel;
};

const baseTypography: TypographyTokens = {
  fontFamilySans: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
  fontFamilyMono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", monospace",
  fontSizeXs: "0.75rem", fontSizeSm: "0.875rem", fontSizeMd: "1rem", fontSizeLg: "1.125rem",
  fontSizeXl: "1.25rem", fontSize2xl: "1.5rem", fontSize3xl: "1.875rem",
  lineHeightTight: "1.25", lineHeightNormal: "1.5", lineHeightRelaxed: "1.75",
  fontWeightNormal: 400, fontWeightMedium: 500, fontWeightSemibold: 600, fontWeightBold: 700,
  letterSpacingTight: "-0.0125em", letterSpacingNormal: "0", letterSpacingWide: "0.025em"
};

const baseSpacing: SpacingTokens = {
  space0: "0", space1: "0.25rem", space2: "0.5rem", space3: "0.75rem", space4: "1rem",
  space5: "1.25rem", space6: "1.5rem", space7: "2rem", space8: "3rem", contentGap: "0.75rem",
  sectionGap: "1.5rem", controlHeightSm: "2rem", controlHeight: "2.5rem", controlHeightLg: "3rem", touchTarget: "2.75rem"
};

const baseRadii: Record<Radius, RadiusTokens> = {
  none: { none: "0", small: "0", medium: "0", large: "0", full: "9999px", control: "0", panel: "0", pill: "9999px" },
  small: { none: "0", small: "0.25rem", medium: "0.375rem", large: "0.5rem", full: "9999px", control: "0.375rem", panel: "0.5rem", pill: "9999px" },
  medium: { none: "0", small: "0.375rem", medium: "0.625rem", large: "0.875rem", full: "9999px", control: "0.625rem", panel: "0.875rem", pill: "9999px" },
  large: { none: "0", small: "0.5rem", medium: "0.75rem", large: "1rem", full: "9999px", control: "0.75rem", panel: "1rem", pill: "9999px" },
  full: { none: "0", small: "9999px", medium: "9999px", large: "9999px", full: "9999px", control: "9999px", panel: "1.25rem", pill: "9999px" }
};

const baseShadows: ShadowTokens = {
  none: "none", sm: "0 1px 2px rgb(15 23 42 / 0.06)", md: "0 4px 12px rgb(15 23 42 / 0.10)",
  lg: "0 12px 32px rgb(15 23 42 / 0.14)", focus: "0 0 0 3px rgb(37 99 235 / 0.28)"
};

const defaultDurations: Record<DurationName, string> = { instant: "0ms", fast: "120ms", normal: "180ms", slow: "280ms" };
const defaultEasings: Record<EasingName, string> = {
  linear: "linear", standard: "cubic-bezier(0.2, 0, 0, 1)", enter: "cubic-bezier(0, 0, 0.2, 1)",
  exit: "cubic-bezier(0.4, 0, 1, 1)", emphasis: "cubic-bezier(0.2, 0.8, 0.2, 1)"
};
const defaultRecipes: Record<MotionRecipeName, MotionRecipe> = {
  messageEntry: { duration: "fast", easing: "enter", distance: 4, scale: 0.99, opacity: 0, stagger: 0 },
  streamActivity: { duration: "instant", easing: "linear", distance: 0, scale: 1, opacity: 1, stagger: 0 },
  panelTransition: { duration: "normal", easing: "standard", distance: 8, scale: 0.995, opacity: 0, stagger: 0 },
  artifactUpdate: { duration: "normal", easing: "emphasis", distance: 0, scale: 0.995, opacity: 0.7, stagger: 0 },
  toolProgress: { duration: "fast", easing: "standard", distance: 2, scale: 1, opacity: 0.75, stagger: 40 },
  approvalAttention: { duration: "normal", easing: "emphasis", distance: 0, scale: 1, opacity: 0.9, stagger: 0 }
};

const densityMultipliers: Record<Density, number> = { compact: 0.875, comfortable: 1, spacious: 1.125 };

const paletteByMode: Record<ThemeMode, ThemeTokens> = {
  light: {
    canvas: "#ffffff", surface: "#f7f7f8", surfaceElevated: "#ffffff", surfaceSubtle: "#f2f3f5", text: "#17191c", textMuted: "#59616b", textSubtle: "#737b86",
    border: "#dfe2e6", borderStrong: "#c5c9d0", accent: "#4f46e5", accentForeground: "#ffffff", accentMuted: "#eef2ff", focus: "#2563eb", selection: "#c7d2fe",
    input: "#ffffff", inputBorder: "#c8cdd5", disabled: "#eef0f2", disabledForeground: "#8a919b", destructive: "#b91c1c", destructiveForeground: "#ffffff",
    success: "#15803d", successForeground: "#ffffff", warning: "#a16207", warningForeground: "#ffffff", info: "#0369a1", infoForeground: "#ffffff",
    assistantSurface: "#f5f5f4", userSurface: "#eef2ff", toolSurface: "#ecfeff", reasoningSurface: "#f5f3ff", approvalSurface: "#fff7ed", artifactSurface: "#f0fdf4"
  },
  dark: {
    canvas: "#0d0f12", surface: "#15181d", surfaceElevated: "#1c2128", surfaceSubtle: "#20242b", text: "#f3f4f6", textMuted: "#a6afb9", textSubtle: "#8993a2",
    border: "#303743", borderStrong: "#4a5563", accent: "#818cf8", accentForeground: "#111827", accentMuted: "#282b55", focus: "#60a5fa", selection: "#3730a3",
    input: "#11151a", inputBorder: "#4a5563", disabled: "#242a31", disabledForeground: "#707986", destructive: "#f87171", destructiveForeground: "#450a0a",
    success: "#4ade80", successForeground: "#052e16", warning: "#fbbf24", warningForeground: "#422006", info: "#38bdf8", infoForeground: "#082f49",
    assistantSurface: "#1c2026", userSurface: "#20234a", toolSurface: "#12313a", reasoningSurface: "#2a2545", approvalSurface: "#332719", artifactSurface: "#173424"
  },
  "high-contrast": {
    canvas: "#ffffff", surface: "#ffffff", surfaceElevated: "#ffffff", surfaceSubtle: "#f7f7f7", text: "#000000", textMuted: "#2b2b2b", textSubtle: "#404040",
    border: "#000000", borderStrong: "#000000", accent: "#0000b8", accentForeground: "#ffffff", accentMuted: "#e5e5ff", focus: "#000000", selection: "#b8c7ff",
    input: "#ffffff", inputBorder: "#000000", disabled: "#e5e5e5", disabledForeground: "#404040", destructive: "#a40000", destructiveForeground: "#ffffff",
    success: "#006b2d", successForeground: "#ffffff", warning: "#6b3b00", warningForeground: "#ffffff", info: "#005a8c", infoForeground: "#ffffff",
    assistantSurface: "#f3f3f3", userSurface: "#e9e9ff", toolSurface: "#e5ffff", reasoningSurface: "#f0eaff", approvalSurface: "#fff0df", artifactSurface: "#e9ffe9"
  }
};

const accentPalettes: Record<AccentName, Pick<ThemeTokens, "accent" | "accentForeground" | "accentMuted">> = {
  indigo: { accent: "#4f46e5", accentForeground: "#ffffff", accentMuted: "#eef2ff" }, blue: { accent: "#1d4ed8", accentForeground: "#ffffff", accentMuted: "#dbeafe" },
  teal: { accent: "#0f766e", accentForeground: "#ffffff", accentMuted: "#ccfbf1" }, violet: { accent: "#6d28d9", accentForeground: "#ffffff", accentMuted: "#ede9fe" },
  rose: { accent: "#be123c", accentForeground: "#ffffff", accentMuted: "#ffe4e6" }, amber: { accent: "#a16207", accentForeground: "#ffffff", accentMuted: "#fef3c7" }
};

const temperatureOverrides: Record<ThemeMode, Record<ThemeTemperature, Partial<ThemeTokens>>> = {
  light: {
    neutral: {},
    warm: { canvas: "#fffdfa", surface: "#faf7f2", surfaceElevated: "#fffefa", surfaceSubtle: "#f6f0e8", text: "#241f1b", textMuted: "#685f57", textSubtle: "#7c7168", border: "#e4ded5", borderStrong: "#cfc5ba", input: "#fffefa", inputBorder: "#cfc5ba", assistantSurface: "#f8f4ee", reasoningSurface: "#f6f0ff" },
    cool: { canvas: "#fbfdff", surface: "#f5f8fc", surfaceElevated: "#ffffff", surfaceSubtle: "#eef3f8", text: "#18212b", textMuted: "#5d6875", textSubtle: "#758291", border: "#dce3ec", borderStrong: "#c0ccd9", input: "#ffffff", inputBorder: "#c0ccd9", assistantSurface: "#f1f5f9", reasoningSurface: "#f2f2ff" }
  },
  dark: {
    neutral: {},
    warm: { canvas: "#120f0c", surface: "#1b1713", surfaceElevated: "#24201b", surfaceSubtle: "#2a241e", text: "#f6f2ed", textMuted: "#b9ada1", textSubtle: "#9a8e83", border: "#3c342c", borderStrong: "#5a4b3f", input: "#17130f", inputBorder: "#5a4b3f", assistantSurface: "#24201b", reasoningSurface: "#2e2740" },
    cool: { canvas: "#0b1118", surface: "#121a23", surfaceElevated: "#1a2530", surfaceSubtle: "#202d39", text: "#f0f6fc", textMuted: "#a7b6c5", textSubtle: "#899bab", border: "#2d3d4d", borderStrong: "#496073", input: "#0f171f", inputBorder: "#496073", assistantSurface: "#1b2530", reasoningSurface: "#252542" }
  },
  "high-contrast": {
    neutral: {},
    warm: { canvas: "#fffdf8", surface: "#fffdf8", surfaceElevated: "#ffffff", surfaceSubtle: "#fff8ed", text: "#1a1005", textMuted: "#33261a", border: "#000000", borderStrong: "#000000", input: "#ffffff", inputBorder: "#000000" },
    cool: { canvas: "#fafdff", surface: "#fafdff", surfaceElevated: "#ffffff", surfaceSubtle: "#eef8ff", text: "#001018", textMuted: "#142a35", border: "#000000", borderStrong: "#000000", input: "#ffffff", inputBorder: "#000000" }
  }
};

function scaleLength(value: string, multiplier: number): string {
  const match = /^(\d+(?:\.\d+)?)(rem|px)$/.exec(value);
  if (!match) return value;
  return `${Number((Number(match[1]) * multiplier).toFixed(4))}${match[2]}`;
}

function resolveSpacing(density: Density, overrides?: Partial<SpacingTokens>): SpacingTokens {
  const multiplier = densityMultipliers[density];
  const scaled: SpacingTokens = {
    ...baseSpacing,
    contentGap: scaleLength(baseSpacing.contentGap, multiplier), sectionGap: scaleLength(baseSpacing.sectionGap, multiplier),
    controlHeightSm: scaleLength(baseSpacing.controlHeightSm, multiplier), controlHeight: scaleLength(baseSpacing.controlHeight, multiplier),
    controlHeightLg: scaleLength(baseSpacing.controlHeightLg, multiplier), touchTarget: scaleLength(baseSpacing.touchTarget, multiplier)
  };
  return { ...scaled, ...overrides };
}

function resolveMotion(options?: MotionOptions): MotionTokens {
  const level = options?.level ?? "subtle";
  const durations: Record<DurationName, string> = { ...defaultDurations, ...(options?.durations ?? {}) };
  if (level === "none") {
    for (const name of durationNames) durations[name] = "0ms";
  } else if (level === "expressive") {
    // Expressive motion is deliberately slower only for untouched defaults;
    // an explicit duration is an intentional product-level choice.
    for (const name of durationNames) {
      if (options?.durations?.[name] !== undefined) continue;
      const match = /^(\d+(?:\.\d+)?)ms$/.exec(durations[name]);
      if (match) durations[name] = `${Number((Number(match[1]) * 1.25).toFixed(2))}ms`;
    }
  }
  const easings: Record<EasingName, string> = { ...defaultEasings, ...(options?.easings ?? {}) };
  const levelScale = level === "expressive" ? 1.25 : level === "none" ? 0 : 1;
  const distance = Math.max(0, options?.distance ?? 8) * levelScale;
  const scale = level === "none" ? 1 : options?.scale ?? 0.985;
  const opacity = level === "none" ? 1 : options?.opacity ?? 0;
  const stagger = level === "expressive" ? Math.max(0, options?.stagger ?? 48) : level === "none" ? 0 : Math.max(0, options?.stagger ?? 24);
  const recipes = {} as Record<MotionRecipeName, ResolvedMotionRecipe>;
  for (const name of motionRecipeNames) {
    const source = { ...defaultRecipes[name], ...(options?.recipes?.[name] ?? {}) };
    const recipeDistance = level === "none" ? 0 : Math.max(0, source.distance * levelScale || distance);
    const recipeScale = level === "none" ? 1 : source.scale;
    const recipeOpacity = level === "none" ? 1 : source.opacity;
    const recipeStagger = level === "none" ? 0 : Math.max(0, source.stagger || stagger);
    recipes[name] = {
      ...source, distance: recipeDistance, scale: recipeScale, opacity: recipeOpacity, stagger: recipeStagger,
      durationValue: level === "none" ? "0ms" : durations[source.duration], easingValue: level === "none" ? "linear" : easings[source.easing],
      distanceValue: `${recipeDistance}px`, staggerValue: `${recipeStagger}ms`,
      reduced: { durationValue: "0ms", easingValue: "linear", distanceValue: "0px", scale: 1, opacity: 1, staggerValue: "0ms" }
    };
  }
  return { level, durations, easings, distance, scale, opacity, stagger, recipes };
}

/** Create a complete, serialisable theme from safe neutral defaults. */
export function createTheme(options: ThemeOptions = {}): ResolvedTheme {
  const mode = options.mode ?? "light";
  const temperature = options.temperature ?? "neutral";
  const density = options.density ?? "comfortable";
  const radius = options.radius ?? "medium";
  const accent = options.accent ?? "indigo";
  const tokens: ThemeTokens = {
    ...paletteByMode[mode], ...temperatureOverrides[mode][temperature], ...accentPalettes[accent], ...(options.tokens ?? {})
  };
  return {
    schemaVersion: themeSchemaVersion, mode, temperature, density, radius, accent, tokens,
    typography: { ...baseTypography, ...(options.typography ?? {}) }, spacing: resolveSpacing(density, options.spacing),
    radii: { ...baseRadii[radius] }, shadows: { ...baseShadows, ...(options.shadows ?? {}) }, motion: resolveMotion(options.motion)
  };
}

/** Alias for callers that prefer an explicit resolver name. */
export const resolveTheme = createTheme;

/** Return attributes suitable for a framework's root theme/provider element. */
export function getThemeAttributes(theme: ResolvedTheme): ThemeAttributeMap {
  return { "data-aifk-theme": theme.mode, "data-aifk-temperature": theme.temperature, "data-aifk-density": theme.density, "data-aifk-radius": theme.radius, "data-aifk-motion": theme.motion.level };
}

function kebabCase(value: string): string { return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`); }

/** Project a theme to CSS custom properties usable by any renderer. */
export function toCssVariables(theme: ResolvedTheme): Record<string, string> {
  const variables: Record<string, string> = {};
  const add = (prefix: string, values: object) => {
    for (const [name, value] of Object.entries(values)) variables[`--aifk-${prefix ? `${prefix}-` : ""}${kebabCase(name)}`] = String(value);
  };
  add("", theme.tokens); add("type", theme.typography); add("space", theme.spacing); add("radius", theme.radii); add("shadow", theme.shadows);
  add("motion-duration", theme.motion.durations); add("motion-easing", theme.motion.easings);
  for (const name of motionRecipeNames) {
    const recipe = theme.motion.recipes[name]; const prefix = `motion-${kebabCase(name)}`;
    variables[`--aifk-${prefix}-duration`] = recipe.durationValue; variables[`--aifk-${prefix}-easing`] = recipe.easingValue;
    variables[`--aifk-${prefix}-distance`] = recipe.distanceValue; variables[`--aifk-${prefix}-scale`] = String(recipe.scale);
    variables[`--aifk-${prefix}-opacity`] = String(recipe.opacity); variables[`--aifk-${prefix}-stagger`] = recipe.staggerValue;
    variables[`--aifk-${prefix}-reduced-duration`] = recipe.reduced.durationValue; variables[`--aifk-${prefix}-reduced-distance`] = recipe.reduced.distanceValue;
  }
  variables["--aifk-motion-level"] = theme.motion.level; variables["--aifk-motion-distance"] = `${theme.motion.distance}px`;
  variables["--aifk-motion-scale"] = String(theme.motion.scale); variables["--aifk-motion-opacity"] = String(theme.motion.opacity);
  variables["--aifk-motion-stagger"] = `${theme.motion.stagger}ms`; variables["--aifk-theme-mode"] = theme.mode;
  variables["--aifk-theme-temperature"] = theme.temperature; variables["--aifk-theme-density"] = theme.density; variables["--aifk-theme-radius"] = theme.radius;
  return variables;
}

type Rgb = [number, number, number];
function parseColor(value: string): Rgb | null {
  const input = value.trim().toLowerCase(); if (input === "white") return [255, 255, 255]; if (input === "black") return [0, 0, 0];
  const hex = input.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex)) return [0, 1, 2].map((index) => Number.parseInt(`${hex[index]}${hex[index]}`, 16)) as Rgb;
  if (/^[0-9a-f]{6}$/.test(hex)) return [0, 2, 4].map((index) => Number.parseInt(hex.slice(index, index + 2), 16)) as Rgb;
  const rgb = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/.exec(input);
  return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] as Rgb : null;
}
function relativeLuminance(rgb: Rgb): number {
  const channels = rgb.map((channel) => { const value = channel / 255; return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}
/** Calculate the WCAG contrast ratio for two CSS colors when parseable. */
export function contrastRatio(foreground: string, background: string): number | null {
  const foregroundRgb = parseColor(foreground); const backgroundRgb = parseColor(background); if (!foregroundRgb || !backgroundRgb) return null;
  const foregroundLuminance = relativeLuminance(foregroundRgb); const backgroundLuminance = relativeLuminance(backgroundRgb);
  const lighter = Math.max(foregroundLuminance, backgroundLuminance); const darker = Math.min(foregroundLuminance, backgroundLuminance);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastCheck { foreground: TokenName; background: TokenName; ratio: number | null; minimum: 4.5; passes: boolean; }
/** Check the text/status pairs used by official components against WCAG AA. */
export function checkThemeContrast(theme: ResolvedTheme): ContrastCheck[] {
  const pairs: Array<[TokenName, TokenName]> = [["text", "canvas"], ["text", "surface"], ["textMuted", "canvas"], ["accentForeground", "accent"], ["destructiveForeground", "destructive"], ["successForeground", "success"], ["warningForeground", "warning"], ["infoForeground", "info"]];
  return pairs.map(([foreground, background]) => { const ratio = contrastRatio(theme.tokens[foreground], theme.tokens[background]); return { foreground, background, ratio, minimum: 4.5, passes: ratio !== null && ratio >= 4.5 }; });
}
