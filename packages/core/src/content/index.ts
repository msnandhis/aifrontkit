export type FileStatus = "loading" | "ready" | "failed";

export type FileSource =
  | { kind: "url"; url: string }
  | { kind: "data"; data: string }
  | { kind: "id"; id: string };

export interface FileContentPart {
  /** Stable identifier when this file is addressed by a transcript event. */
  id?: string;
  /** Message-part lifecycle, separate from the file transfer `status` below. */
  partStatus?: "pending" | "streaming" | "complete" | "interrupted" | "failed";
  type: "file";
  name: string;
  mediaType?: string;
  size?: number;
  status?: FileStatus;
  source?: FileSource;
  /** @deprecated Use `source: { kind: "url", url }`. */
  url?: string;
}

export type FileKind = "image" | "document" | "data" | "text" | "audio" | "video" | "archive" | "file";

export function classifyFileMediaType(mediaType?: string): FileKind {
  const value = mediaType?.toLowerCase() ?? "";
  if (value.startsWith("image/")) return "image";
  if (value.startsWith("audio/")) return "audio";
  if (value.startsWith("video/")) return "video";
  if (value.startsWith("text/")) return "text";
  if (value.includes("json") || value.includes("csv") || value.includes("spreadsheet")) return "data";
  if (value.includes("pdf") || value.includes("document") || value.includes("word")) return "document";
  if (value.includes("zip") || value.includes("archive") || value.includes("compressed")) return "archive";
  return "file";
}

export function formatFileSize(bytes?: number): string | undefined {
  if (bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return undefined;
  if (bytes < 1000) return `${bytes} B`;
  const units = ["kB", "MB", "GB", "TB"] as const;
  let value = bytes / 1000;
  let unit = 0;
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000;
    unit += 1;
  }
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export function getFileSource(file: FileContentPart): FileSource | undefined {
  if (file.source) return file.source;
  return file.url ? { kind: "url", url: file.url } : undefined;
}

function isSafeRemoteUrl(value: string) {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:" || protocol === "blob:";
  } catch {
    return false;
  }
}

/** Returns a browser-resolvable download target. Opaque provider IDs intentionally return undefined. */
export function resolveFileDownloadTarget(file: FileContentPart): string | undefined {
  const source = getFileSource(file);
  if (!source || source.kind === "id") return undefined;
  if (source.kind === "data") return source.data.startsWith("data:") ? source.data : undefined;
  return isSafeRemoteUrl(source.url) ? source.url : undefined;
}
