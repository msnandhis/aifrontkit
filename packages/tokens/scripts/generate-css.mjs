import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createTheme, toCssVariables } from "../dist/index.js";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceFile = resolve(packageRoot, "src/tokens.css");
const distributionFile = resolve(packageRoot, "dist/tokens.css");
const checkOnly = process.argv.includes("--check");

const metadataVariables = new Set([
  "--aifk-theme-mode",
  "--aifk-theme-temperature",
  "--aifk-theme-density",
  "--aifk-theme-radius"
]);

function variables(options) {
  return toCssVariables(createTheme(options));
}

function difference(current, baseline) {
  return Object.fromEntries(
    Object.entries(current).filter(([name, value]) => !metadataVariables.has(name) && baseline[name] !== value)
  );
}

function declarations(values, indentation = "  ") {
  return Object.entries(values)
    .filter(([name]) => !metadataVariables.has(name))
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${indentation}${name}: ${value};`)
    .join("\n");
}

function rule(selectors, values, extras = []) {
  const body = [...extras.map((value) => `  ${value}`), declarations(values)].filter(Boolean).join("\n");
  return `${selectors.join(",\n")} {\n${body}\n}`;
}

function modeSelectors(mode) {
  return [`[data-aifk-theme="${mode}"]`, `[data-aifk-mode="${mode}"]`];
}

function scopedSelectors(mode, attribute, value) {
  const attributeSelector = `[${attribute}="${value}"]`;
  const selectors = modeSelectors(mode).map((selector) => `${selector}${attributeSelector}`);
  if (mode === "light") selectors.unshift(`:root:not([data-aifk-theme]):not([data-aifk-mode])${attributeSelector}`);
  return selectors;
}

const baseOptions = { mode: "light", temperature: "neutral", density: "comfortable", radius: "medium", motion: { level: "subtle" } };
const base = variables(baseOptions);
const sections = [
  "/* This file is generated from src/index.ts. Run `pnpm --filter @aifrontkit/tokens build`; do not hand-edit. */",
  rule([":root", ...modeSelectors("light")], base, ["color-scheme: light;"])
];

for (const mode of ["dark", "high-contrast"]) {
  sections.push(rule(modeSelectors(mode), variables({ ...baseOptions, mode }), [`color-scheme: ${mode === "dark" ? "dark" : "light"};`]));
}

sections.push(`@media (prefers-color-scheme: dark) {\n${rule(
  [":root:not([data-aifk-theme]):not([data-aifk-mode])"],
  variables({ ...baseOptions, mode: "dark" }),
  ["color-scheme: dark;"]
).split("\n").map((line) => `  ${line}`).join("\n")}\n}`);

for (const mode of ["light", "dark", "high-contrast"]) {
  const neutral = variables({ ...baseOptions, mode });
  for (const temperature of ["warm", "cool"]) {
    sections.push(rule(
      scopedSelectors(mode, "data-aifk-temperature", temperature),
      difference(variables({ ...baseOptions, mode, temperature }), neutral)
    ));
  }
}

for (const density of ["compact", "spacious"]) {
  sections.push(rule(
    [`[data-aifk-density="${density}"]`],
    difference(variables({ ...baseOptions, density }), base)
  ));
}

for (const radius of ["none", "small", "large", "full"]) {
  sections.push(rule(
    [`[data-aifk-radius="${radius}"]`],
    difference(variables({ ...baseOptions, radius }), base)
  ));
}

for (const level of ["none", "expressive"]) {
  sections.push(rule(
    [`[data-aifk-motion="${level}"]`],
    difference(variables({ ...baseOptions, motion: { level } }), base)
  ));
}

const reduced = difference(variables({ ...baseOptions, motion: { level: "none" } }), base);
sections.push(`@media (prefers-reduced-motion: reduce) {\n${rule(
  [":root", "[data-aifk-motion]"],
  reduced
).split("\n").map((line) => `  ${line}`).join("\n")}\n}`);

sections.push(`@media (forced-colors: active) {\n  :root,\n  [data-aifk-theme] {\n    --aifk-border: CanvasText;\n    --aifk-border-strong: CanvasText;\n    --aifk-focus: Highlight;\n    --aifk-text: CanvasText;\n    --aifk-text-muted: CanvasText;\n  }\n}`);

const output = `${sections.join("\n\n")}\n`;

if (checkOnly) {
  const current = await readFile(sourceFile, "utf8").catch(() => "");
  if (current !== output) {
    console.error("Generated token CSS is stale. Run `pnpm --filter @aifrontkit/tokens build`.");
    process.exitCode = 1;
  }
} else {
  await mkdir(dirname(distributionFile), { recursive: true });
  await Promise.all([
    writeFile(sourceFile, output),
    writeFile(distributionFile, output)
  ]);
}
