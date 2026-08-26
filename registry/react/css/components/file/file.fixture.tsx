import { File } from "./file.js";

export type FileFixtureId = "default" | "loading" | "ready" | "failed" | "download-unavailable";

export function FileFixture({ id = "default" }: { id?: FileFixtureId }) {
  if (id === "loading") return <File file={{ type: "file", name: "research-notes.md", mediaType: "text/markdown", status: "loading" }} />;
  if (id === "failed") return <File file={{ type: "file", name: "damaged.zip", mediaType: "application/zip", status: "failed" }} />;
  if (id === "download-unavailable") return <File.Root file={{ type: "file", name: "provider-file.pdf", source: { kind: "id", id: "file_123" } }}><File.Icon /><File.Details><File.Name /><File.Size /></File.Details><File.Download unavailable="Download unavailable" /></File.Root>;
  if (id === "ready") return <File variant="muted" file={{ type: "file", name: "architecture.pdf", mediaType: "application/pdf", size: 2048, source: { kind: "url", url: "https://example.com/architecture.pdf" } }} />;
  return <File file={{ type: "file", name: "product-brief.pdf", mediaType: "application/pdf", size: 248000, source: { kind: "url", url: "https://example.com/product-brief.pdf" } }} />;
}
