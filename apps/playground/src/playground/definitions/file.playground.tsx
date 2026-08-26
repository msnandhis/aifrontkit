import type { FileContentPart, FileStatus } from "@aifrontkit/core/content";
import { File } from "../../../../../registry/react/css/components/file/file.js";
import { definePlayground, type PlaygroundState } from "../types.js";
import { q } from "./shared.js";

interface FileState extends PlaygroundState {
  name: string;
  mediaType: string;
  bytes: number;
  status: FileStatus;
  variant: "outline" | "ghost" | "muted";
  size: "sm" | "default" | "lg";
  source: "url" | "id" | "none";
  sourceValue: string;
  showDownload: boolean;
  showStatus: boolean;
  customIcon: boolean;
}

const defaults: FileState = {
  name: "product-brief.pdf",
  mediaType: "application/pdf",
  bytes: 248000,
  status: "ready",
  variant: "outline",
  size: "default",
  source: "url",
  sourceValue: "https://example.com/product-brief.pdf",
  showDownload: true,
  showStatus: true,
  customIcon: false,
};

function fileFor(state: FileState): FileContentPart {
  return {
    type: "file",
    name: state.name,
    ...(state.mediaType ? { mediaType: state.mediaType } : {}),
    size: state.bytes,
    status: state.status,
    ...(state.source === "url" ? { source: { kind: "url" as const, url: state.sourceValue } } : {}),
    ...(state.source === "id" ? { source: { kind: "id" as const, id: state.sourceValue } } : {}),
  };
}

function preview(state: FileState, emit: (message: string) => void) {
  const file = fileFor(state);
  return (
    <File.Root file={file} variant={state.variant} size={state.size}>
      <File.Icon>{state.customIcon ? <span className="playground-avatar">AF</span> : undefined}</File.Icon>
      <File.Details>
        <File.Name />
        <File.Size />
        {state.showStatus ? <File.Status /> : null}
      </File.Details>
      {state.showDownload ? <File.Download onClick={() => emit("onDownload(" + q(state.name) + ")")} unavailable="Download unavailable" /> : null}
    </File.Root>
  );
}

function codeFor(state: FileState) {
  const source = state.source === "url"
    ? '  source: { kind: "url", url: ' + q(state.sourceValue) + " },"
    : state.source === "id"
      ? '  source: { kind: "id", id: ' + q(state.sourceValue) + " },"
      : "";
  return [
    'import { File } from "@/components/aifrontkit/file";',
    "",
    "const file = {",
    '  type: "file" as const,',
    "  name: " + q(state.name) + ",",
    "  mediaType: " + q(state.mediaType) + ",",
    "  size: " + state.bytes + ",",
    "  status: " + q(state.status) + ",",
    source,
    "};",
    "",
    "export function FileExample() {",
    "  return (",
    "  <File.Root file={file} variant=" + q(state.variant) + " size=" + q(state.size) + ">",
    state.customIcon ? '    <File.Icon><span aria-hidden="true">AF</span></File.Icon>' : "    <File.Icon />",
    "    <File.Details>",
    "      <File.Name />",
    "      <File.Size />",
    state.showStatus ? "      <File.Status />" : "",
    "    </File.Details>",
    state.showDownload ? '    <File.Download unavailable="Download unavailable" />' : "",
    "  </File.Root>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

export const filePlayground = definePlayground({
  id: "file",
  label: "File",
  description: "Configure file metadata, lifecycle, visual treatment, source resolution, and compound slots.",
  defaults,
  presets: [
    { id: "default", label: "PDF", description: "A ready, downloadable PDF document.", values: {} },
    { id: "image", label: "Image", description: "MIME-aware image presentation.", values: { name: "interface-preview.png", mediaType: "image/png", bytes: 864000 } },
    { id: "loading", label: "Loading", description: "Preparation status replaces download availability.", values: { status: "loading" } },
    { id: "failed", label: "Failed", description: "An unavailable file announces its state.", values: { status: "failed", name: "damaged-archive.zip", mediaType: "application/zip" } },
    { id: "provider-id", label: "Provider ID", description: "Opaque IDs cannot produce a browser download target.", values: { source: "id", sourceValue: "file_123" } },
    { id: "muted", label: "Muted", description: "Background-filled presentation without a strong border.", values: { variant: "muted" } },
  ],
  controls: [
    { key: "name", label: "File name", type: "text", group: "Content" },
    { key: "mediaType", label: "MIME type", description: "Selects the default icon.", type: "text", group: "Content" },
    { key: "bytes", label: "File size", type: "range", min: 0, max: 1000000, step: 1000, unit: " B", group: "Content" },
    { key: "variant", label: "Variant", type: "segmented", group: "Appearance", options: [{ label: "Outline", value: "outline" }, { label: "Ghost", value: "ghost" }, { label: "Muted", value: "muted" }] },
    { key: "size", label: "Size", type: "segmented", group: "Appearance", options: [{ label: "Small", value: "sm" }, { label: "Default", value: "default" }, { label: "Large", value: "lg" }] },
    { key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: [{ label: "Ready", value: "ready" }, { label: "Loading", value: "loading" }, { label: "Failed", value: "failed" }] },
    { key: "showDownload", label: "Download action", type: "boolean", group: "Slots" },
    { key: "showStatus", label: "Status text", type: "boolean", group: "Slots" },
    { key: "customIcon", label: "Custom icon", type: "boolean", group: "Slots" },
    { key: "source", label: "Source type", type: "segmented", group: "Advanced", options: [{ label: "URL", value: "url" }, { label: "ID", value: "id" }, { label: "None", value: "none" }] },
    { key: "sourceValue", label: "Source value", type: "text", group: "Advanced", visible: (state) => state.source !== "none" },
  ],
  render: (state, context) => preview(state, context.emit),
  generateCode: codeFor,
});
