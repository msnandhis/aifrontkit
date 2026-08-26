import { describe, expect, it } from "vitest";
import { classifyFileMediaType, formatFileSize, resolveFileDownloadTarget } from "../src/content/index.js";

describe("file content utilities", () => {
  it("formats sizes and classifies media types without UI dependencies", () => {
    expect(formatFileSize(2048)).toBe("2.0 kB");
    expect(classifyFileMediaType("application/pdf")).toBe("document");
    expect(classifyFileMediaType("image/png")).toBe("image");
  });

  it("only resolves safe browser download targets", () => {
    expect(resolveFileDownloadTarget({ type: "file", name: "report.pdf", source: { kind: "url", url: "https://example.com/report.pdf" } })).toBe("https://example.com/report.pdf");
    expect(resolveFileDownloadTarget({ type: "file", name: "secret", source: { kind: "url", url: "javascript:alert(1)" } })).toBeUndefined();
    expect(resolveFileDownloadTarget({ type: "file", name: "remote", source: { kind: "id", id: "file_123" } })).toBeUndefined();
  });
});
