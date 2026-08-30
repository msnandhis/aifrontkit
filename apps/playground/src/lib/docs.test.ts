import { describe, expect, it } from "vitest";
import searchSources from "virtual:aifrontkit-docs-search";
import { docSections, docs, docsByPath } from "./docs.js";

describe("documentation registry", () => {
  it("creates one unique deep link for every navigation entry", () => {
    const paths = docs.map((doc) => doc.path);
    expect(new Set(paths).size).toBe(paths.length);
    expect(docsByPath.size).toBe(paths.length);
    expect(docSections.flatMap((section) => section.pages)).toHaveLength(docs.length);
  });

  it("publishes an interactive page for every current registry component", () => {
    expect(docs.filter((doc) => doc.component).map((doc) => doc.component)).toEqual([
      "conversation",
      "message",
      "prompt-input",
      "file",
      "tool-call",
    ]);
  });

  it("covers the promised framework getting-started paths", () => {
    for (const path of [
      "/docs/start/cli",
      "/docs/start/manual-installation",
      "/docs/start/react",
      "/docs/start/vite",
      "/docs/start/next-app-router",
      "/docs/start/next-pages-router",
    ]) expect(docsByPath.has(path)).toBe(true);
  });

  it("indexes authored documentation content", () => {
    expect(searchSources["primitives/message.md"]).toContain("aria-busy");
  });
});
