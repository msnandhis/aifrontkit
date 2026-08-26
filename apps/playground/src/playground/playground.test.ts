import { describe, expect, it } from "vitest";
import ts from "typescript";
import { tokenize } from "./code-view.js";
import { playgroundDefinitions } from "./definitions/index.js";
import { normalizePlaygroundState, stateMatches } from "./url-state.js";

describe("component playground contract", () => {
  it("provides controls, presets, and synchronized code for every documented component", () => {
    for (const definition of Object.values(playgroundDefinitions)) {
      expect(definition.controls.length).toBeGreaterThan(0);
      expect(definition.presets.length).toBeGreaterThan(1);
      expect(new Set(definition.controls.map((control) => control.key)).size).toBe(definition.controls.length);
      const code = definition.generateCode(definition.defaults);
      expect(code).toContain("export function");
      expect(code).not.toMatch(/ConversationHeader|EmptyState|MessageActions|PromptToolbar|ToolActions/);
      const result = ts.transpileModule(code, {
        compilerOptions: { jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
        reportDiagnostics: true,
      });
      expect(result.diagnostics?.filter((diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error)).toEqual([]);
    }
  });

  it("places exact edited values in generated code", () => {
    const conversation = playgroundDefinitions.conversation;
    const state = { ...conversation.defaults, userMessage: "Exact preview value <with symbols>", presentation: "workspace" };
    const code = conversation.generateCode(state);
    expect(code).toContain(JSON.stringify(state.userMessage));
    expect(code).toContain('presentation="workspace"');

    const file = playgroundDefinitions.file;
    expect(file.generateCode({ ...file.defaults, name: "release-notes.md" })).toContain('name: "release-notes.md"');
  });

  it("distinguishes component tags, prop names, and literal values", () => {
    const tokens = tokenize('<File.Root variant="muted" size="lg" />');
    expect(tokens).toContainEqual({ kind: "tag", value: "File.Root" });
    expect(tokens).toContainEqual({ kind: "property", value: "variant" });
    expect(tokens).toContainEqual({ kind: "string", value: '"muted"' });
  });

  it("detects curated presets without requiring a complete state duplicate", () => {
    expect(stateMatches({ status: "failed", variant: "outline" }, { status: "failed" })).toBe(true);
    expect(stateMatches({ status: "ready" }, { status: "failed" })).toBe(false);
  });

  it("rejects invalid URL option values and clamps numeric controls", () => {
    const definition = playgroundDefinitions.file;
    const state = normalizePlaygroundState({ ...definition.defaults, variant: "invalid", bytes: 2000000 }, definition.defaults, definition.controls);
    expect(state.variant).toBe("outline");
    expect(state.bytes).toBe(1000000);
  });
});
