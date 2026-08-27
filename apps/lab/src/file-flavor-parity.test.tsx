import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { FileContentPart } from "@aifrontkit/core/content";
import * as CssFile from "../../../registry/react/css/components/file/file.js";
import * as TailwindFile from "../../../registry/react/tailwind/components/file/file.js";

type Equal<Left, Right> = (<Value>() => Value extends Left ? 1 : 2) extends (<Value>() => Value extends Right ? 1 : 2)
  ? (<Value>() => Value extends Right ? 1 : 2) extends (<Value>() => Value extends Left ? 1 : 2) ? true : false
  : false;
type Expect<Value extends true> = Value;

type RootPropsMatch = Expect<Equal<CssFile.FileRootProps, TailwindFile.FileRootProps>>;
type IconPropsMatch = Expect<Equal<CssFile.FileIconProps, TailwindFile.FileIconProps>>;
type DownloadPropsMatch = Expect<Equal<CssFile.FileDownloadProps, TailwindFile.FileDownloadProps>>;
type FilePropsMatch = Expect<Equal<CssFile.FileProps, TailwindFile.FileProps>>;
const compileTimeParity: [RootPropsMatch, IconPropsMatch, DownloadPropsMatch, FilePropsMatch] = [true, true, true, true];

function semanticMarkup(markup: string) {
  return markup.replaceAll(/ class="[^"]*"/g, "");
}

const fixtures: FileContentPart[] = [
  { id: "file-ready", type: "file", name: "report.pdf", mediaType: "application/pdf", size: 2048, source: { kind: "url", url: "https://example.com/report.pdf" }, status: "ready" },
  { id: "file-loading", type: "file", name: "upload.zip", mediaType: "application/zip", status: "loading" },
  { id: "file-failed", type: "file", name: "archive.zip", mediaType: "application/zip", status: "failed" },
  { id: "file-provider", type: "file", name: "provider.pdf", mediaType: "application/pdf", source: { kind: "id", id: "file-123" }, status: "ready" },
];

describe("File registry flavor parity", () => {
  it("exports the same compound anatomy and public prop contracts", () => {
    expect(compileTimeParity).toEqual([true, true, true, true]);
    expect(Object.keys(CssFile.File).sort()).toEqual(Object.keys(TailwindFile.File).sort());
  });

  it.each(fixtures)("keeps semantic DOM parity for $status", (file) => {
    const css = renderToStaticMarkup(<CssFile.File file={file} variant="muted" size="lg" />);
    const tailwind = renderToStaticMarkup(<TailwindFile.File file={file} variant="muted" size="lg" />);
    expect(semanticMarkup(tailwind)).toBe(semanticMarkup(css));
  });
});
