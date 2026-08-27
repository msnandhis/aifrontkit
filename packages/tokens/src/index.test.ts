import { describe, expect, it } from "vitest";
import {
  checkThemeContrast,
  contrastRatio,
  createTheme,
  cssVariableName,
  getThemeAttributes,
  motionRecipeNames,
  resolveTheme,
  toCssVariables
} from "./index.js";

describe("theme contract", () => {
  it("creates polished accessible defaults for every supported mode", () => {
    for (const mode of ["light", "dark", "high-contrast"] as const) {
      for (const temperature of ["neutral", "warm", "cool"] as const) {
        const theme = createTheme({ mode, temperature });
        expect(theme.schemaVersion).toBe(1);
        expect(checkThemeContrast(theme).every((check) => check.passes)).toBe(true);
        expect(theme.tokens.canvas).toMatch(/^#/);
        expect(theme.tokens.action).toMatch(/^#/);
        expect(theme.spacing.touchTarget).toBe("2.75rem");
      }
    }
  });

  it("resolves density, temperature, radius and configurable accents", () => {
    const theme = resolveTheme({ density: "compact", temperature: "cool", radius: "large", accent: "teal" });
    expect(theme.density).toBe("compact");
    expect(theme.temperature).toBe("cool");
    expect(theme.radius).toBe("large");
    expect(theme.tokens.accent).toBe("#0f766e");
    expect(theme.spacing.controlHeight).toBe("2.1875rem");
    expect(theme.radii.control).toBe("0.75rem");
  });

  it("makes motion none deterministic and reduced-motion safe", () => {
    const theme = createTheme({ motion: { level: "none" } });
    for (const recipeName of motionRecipeNames) {
      const recipe = theme.motion.recipes[recipeName];
      expect(recipe.durationValue).toBe("0ms");
      expect(recipe.distanceValue).toBe("0px");
      expect(recipe.scale).toBe(1);
      expect(recipe.opacity).toBe(1);
      expect(recipe.reduced.durationValue).toBe("0ms");
    }
  });

  it("projects serializable values for non-DOM renderers", () => {
    const theme = createTheme({ mode: "dark", motion: { level: "expressive" } });
    const variables = toCssVariables(theme);
    expect(variables["--aifk-canvas"]).toBe("#0d0d0f");
    expect(variables["--aifk-action"]).toBe("#f4f4f5");
    expect(variables["--aifk-z-modal"]).toBe("40");
    expect(variables["--aifk-type-font-family-sans"]).toContain("system-ui");
    expect(variables["--aifk-space-0"]).toBe("0");
    expect(variables["--aifk-space-control-height"]).toBe("2.5rem");
    expect(variables["--aifk-conversation-content-measure"]).toBe("44rem");
    expect(variables["--aifk-file-gap"]).toBe("var(--aifk-density-content-gap)");
    expect(variables["--aifk-motion-message-entry-duration"]).toBe("150ms");
    expect(variables["--aifk-motion-message-entry-reduced-duration"]).toBe("0ms");
    expect(getThemeAttributes(theme)).toEqual({
      "data-aifk-theme": "dark",
      "data-aifk-temperature": "neutral",
      "data-aifk-density": "comfortable",
      "data-aifk-radius": "medium",
      "data-aifk-motion": "expressive"
    });
  });

  it("keeps projected variable names stable for numbered and camel-case tokens", () => {
    expect(cssVariableName("space", "space0")).toBe("--aifk-space-0");
    expect(cssVariableName("type", "fontSize2xl")).toBe("--aifk-type-font-size-2xl");
    expect(cssVariableName("", "surfaceElevated")).toBe("--aifk-surface-elevated");
  });

  it("calculates WCAG contrast for hex and rgba colors", () => {
    expect(contrastRatio("#000", "#fff")).toBeCloseTo(21, 4);
    expect(contrastRatio("rgba(0, 0, 0, 1)", "#fff")).toBeCloseTo(21, 4);
    expect(contrastRatio("var(--aifk-text)", "#fff")).toBeNull();
  });
});
