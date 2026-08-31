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
    const state = { ...conversation.defaults, props: { ...conversation.defaults.props, userMessage: "Exact preview value <with symbols>", presentation: "workspace" } };
    const code = conversation.generateCode(state);
    expect(code).toContain(JSON.stringify(state.props.userMessage));
    expect(code).toContain('presentation="workspace"');

    const file = playgroundDefinitions.file;
    expect(file.generateCode({ ...file.defaults, props: { ...file.defaults.props, name: "release-notes.md" } })).toContain('name: "release-notes.md"');
    expect(file.generateCode({ ...file.defaults, environment: { ...file.defaults.environment, language: "jsx" } })).not.toContain(" as const");
    const loadingFileCode = file.generateCode({ ...file.defaults, props: { ...file.defaults.props, status: "loading", mediaType: "" } });
    expect(loadingFileCode).not.toContain("<File.Download");
    expect(loadingFileCode).not.toContain("mediaType:");

    const message = playgroundDefinitions.message;
    const messageJsx = message.generateCode({ ...message.defaults, environment: { ...message.defaults.environment, language: "jsx" } });
    expect(messageJsx).not.toContain("import type");
    expect(messageJsx).not.toContain(" as const");
    expect(messageJsx).not.toContain(": MessageModel[]");
    expect(messageJsx).toContain('onClick={() => onAction("copy")}');
    expect(messageJsx).toContain('data-aifk-theme="light"');

    const artifactReview = playgroundDefinitions["artifact-review"];
    const conflictCode = artifactReview.generateCode({ ...artifactReview.defaults, props: { ...artifactReview.defaults.props, scenario: "conflict" } });
    expect(conflictCode).toContain('"version": 4');
    expect(conflictCode).toContain('"version": 3');
    expect(conflictCode).toContain("onRequestChanges");

    const attachmentComposer = playgroundDefinitions["attachment-composer"];
    const failureCode = attachmentComposer.generateCode({ ...attachmentComposer.defaults, props: { ...attachmentComposer.defaults.props, scenario: "partial-failure" } });
    expect(failureCode).toContain('"status": "failed"');
    expect(failureCode).toContain("onRetry");
    const offlineCode = attachmentComposer.generateCode({ ...attachmentComposer.defaults, props: { ...attachmentComposer.defaults.props, scenario: "offline-paused" } });
    expect(offlineCode).toContain('"status": "offline"');
    expect(offlineCode).toContain("Keep this draft while I reconnect.");
    const attachmentOnlyCode = attachmentComposer.generateCode({ ...attachmentComposer.defaults, props: { ...attachmentComposer.defaults.props, scenario: "attachment-only" } });
    expect(attachmentOnlyCode).toContain("initialAttachments");
    expect(attachmentOnlyCode).toContain("onSubmit");
  });

  it("distinguishes component tags, prop names, and literal values", () => {
    const tokens = tokenize('<File.Root variant="muted" size="lg" />');
    expect(tokens).toContainEqual({ kind: "tag", value: "File.Root" });
    expect(tokens).toContainEqual({ kind: "property", value: "variant" });
    expect(tokens).toContainEqual({ kind: "string", value: '"muted"' });
  });

  it("detects curated presets without requiring a complete state duplicate", () => {
    const defaults = playgroundDefinitions.file.defaults;
    expect(stateMatches({ ...defaults, props: { ...defaults.props, status: "failed", variant: "outline" } }, { props: { status: "failed" } })).toBe(true);
    expect(stateMatches({ ...defaults, props: { ...defaults.props, status: "ready" } }, { props: { status: "failed" } })).toBe(false);
  });

  it("rejects invalid URL option values and clamps numeric controls", () => {
    const definition = playgroundDefinitions.file;
    const state = normalizePlaygroundState({ ...definition.defaults, props: { ...definition.defaults.props, variant: "invalid", bytes: 2000000 } }, definition.defaults, definition.controls);
    expect(state.props.variant).toBe("outline");
    expect(state.props.bytes).toBe(1000000);
  });
});
