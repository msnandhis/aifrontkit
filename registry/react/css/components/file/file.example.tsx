import type { ReactNode } from "react";
import type { FileContentPart, FileStatus } from "@aifrontkit/core/content";
import {
  definePlaygroundDefinition,
  type PlaygroundEnvironment,
  type PlaygroundRecord,
  type PlaygroundState,
} from "@aifrontkit/testing";
import { exampleEnvironmentControlsFor, exampleEnvironmentDefaults, quote } from "../../examples/shared.js";
import { File } from "./file.js";

export interface FileExampleProps extends PlaygroundRecord {
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

export type FileExampleState = PlaygroundState<FileExampleProps, PlaygroundEnvironment>;
export interface FileExampleRenderContext { emit(message: string): void; }

const defaults: FileExampleState = {
  props: {
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
  },
  environment: { ...exampleEnvironmentDefaults },
};

function fileFor(props: FileExampleProps): FileContentPart {
  return {
    type: "file",
    name: props.name,
    ...(props.mediaType ? { mediaType: props.mediaType } : {}),
    size: props.bytes,
    status: props.status,
    ...(props.source === "url" ? { source: { kind: "url" as const, url: props.sourceValue } } : {}),
    ...(props.source === "id" ? { source: { kind: "id" as const, id: props.sourceValue } } : {}),
  };
}

function renderFile(state: FileExampleState): ReactNode {
  const props = state.props;
  const file = fileFor(props);
  return (
    <File.Root file={file} variant={props.variant} size={props.size}>
      <File.Icon>{props.customIcon ? <span aria-hidden="true">AF</span> : undefined}</File.Icon>
      <File.Details>
        <File.Name />
        <File.Size />
        {props.showStatus ? <File.Status /> : null}
      </File.Details>
      {props.showDownload && props.status === "ready" ? <File.Download unavailable="Download unavailable" /> : null}
    </File.Root>
  );
}

function generateFileCode(state: FileExampleState) {
  const props = state.props;
  const environment = state.environment;
  const typeAssertion = environment.language === "tsx" ? " as const" : "";
  const source = props.source === "url"
    ? '  source: { kind: "url", url: ' + quote(props.sourceValue) + " },"
    : props.source === "id"
      ? '  source: { kind: "id", id: ' + quote(props.sourceValue) + " },"
      : "";
  return [
    "// AIFrontKit example · " + environment.framework + " · " + environment.style + " · " + environment.language,
    'import { File } from "@/components/aifrontkit/file";',
    "",
    "const file = {",
    '  type: "file"' + typeAssertion + ",",
    "  name: " + quote(props.name) + ",",
    props.mediaType ? "  mediaType: " + quote(props.mediaType) + "," : "",
    "  size: " + props.bytes + ",",
    "  status: " + quote(props.status) + ",",
    source,
    "};",
    "",
    "export function FileExample() {",
    "  return (",
    "    <div dir=" + quote(environment.direction) + " data-aifk-theme=" + quote(environment.theme) + " data-aifk-motion=" + quote(environment.motion) + ">",
    "      <File.Root file={file} variant=" + quote(props.variant) + " size=" + quote(props.size) + ">",
    props.customIcon ? '        <File.Icon><span aria-hidden="true">AF</span></File.Icon>' : "        <File.Icon />",
    "        <File.Details>",
    "          <File.Name />",
    "          <File.Size />",
    props.showStatus ? "          <File.Status />" : "",
    "        </File.Details>",
    props.showDownload && props.status === "ready" ? '        <File.Download unavailable="Download unavailable" />' : "",
    "      </File.Root>",
    "    </div>",
    "  );",
    "}",
  ].filter((line, index, array) => line !== "" || array[index - 1] !== "").join("\n");
}

const version = "1.0.0";

export const fileExample = definePlaygroundDefinition<"file", FileExampleProps, PlaygroundEnvironment, ReactNode, FileExampleRenderContext>({
  id: "file",
  version,
  label: "File",
  description: "Configure file metadata, lifecycle, visual treatment, source resolution, and compound slots.",
  defaults,
  scenarios: [
    { id: "default", version, label: "PDF", description: "A ready, downloadable PDF document.", values: {}, testId: "file-default" },
    { id: "image", version, label: "Image", description: "MIME-aware image presentation.", values: { props: { name: "interface-preview.png", mediaType: "image/png", bytes: 864000 } }, testId: "file-image" },
    { id: "loading", version, label: "Loading", description: "Preparation status replaces download availability.", values: { props: { status: "loading" } }, testId: "file-loading" },
    { id: "ready", version, label: "Ready", description: "A compact ready file with a safe browser target.", values: { props: { name: "architecture.pdf", bytes: 2048, variant: "muted", size: "sm" } }, testId: "file-ready" },
    { id: "failed", version, label: "Failed", description: "An unavailable file announces its state.", values: { props: { status: "failed", name: "damaged-archive.zip", mediaType: "application/zip" } }, testId: "file-failed" },
    { id: "download-unavailable", version, label: "Provider ID", description: "Opaque IDs cannot produce a browser download target.", values: { props: { source: "id", sourceValue: "file_123" } }, testId: "file-download-unavailable" },
    { id: "muted", version, label: "Muted", description: "Background-filled presentation without a strong border.", values: { props: { variant: "muted", size: "lg" } }, testId: "file-muted" },
  ],
  controls: [
    { scope: "props", key: "name", label: "File name", type: "text", group: "Content" },
    { scope: "props", key: "mediaType", label: "MIME type", description: "Selects the default icon.", type: "text", group: "Content" },
    { scope: "props", key: "bytes", label: "File size", type: "range", min: 0, max: 1000000, step: 1000, unit: " B", group: "Content" },
    { scope: "props", key: "variant", label: "Variant", type: "segmented", group: "Appearance", options: [{ label: "Outline", value: "outline" }, { label: "Ghost", value: "ghost" }, { label: "Muted", value: "muted" }] },
    { scope: "props", key: "size", label: "Size", type: "segmented", group: "Appearance", options: [{ label: "Small", value: "sm" }, { label: "Default", value: "default" }, { label: "Large", value: "lg" }] },
    { scope: "props", key: "status", label: "Lifecycle", type: "select", group: "Behavior", options: [{ label: "Ready", value: "ready" }, { label: "Loading", value: "loading" }, { label: "Failed", value: "failed" }] },
    { scope: "props", key: "showDownload", label: "Download action", type: "boolean", group: "Slots" },
    { scope: "props", key: "showStatus", label: "Status text", type: "boolean", group: "Slots" },
    { scope: "props", key: "customIcon", label: "Custom icon", type: "boolean", group: "Slots" },
    { scope: "props", key: "source", label: "Source type", type: "segmented", group: "Advanced", options: [{ label: "URL", value: "url" }, { label: "ID", value: "id" }, { label: "None", value: "none" }] },
    { scope: "props", key: "sourceValue", label: "Source value", type: "text", group: "Advanced", visible: (state) => state.props.source !== "none" },
    ...exampleEnvironmentControlsFor(defaults),
  ],
  render: (state) => renderFile(state),
  generateCode: generateFileCode,
});
