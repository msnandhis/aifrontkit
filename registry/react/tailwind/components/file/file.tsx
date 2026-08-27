"use client";

import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { classifyFileMediaType, formatFileSize, resolveFileDownloadTarget, type FileContentPart, type FileKind } from "@aifrontkit/core/content";

export type FileVariant = "outline" | "ghost" | "muted";
export type FileSizeValue = "sm" | "default" | "lg";

interface FileContextValue {
  file: FileContentPart;
  kind: FileKind;
  target: string | undefined;
}

const FileContext = createContext<FileContextValue | null>(null);

function useFile() {
  const context = useContext(FileContext);
  if (!context) throw new Error("File compound parts must be inside <File.Root>.");
  return context;
}

function cx(...values: Array<string | undefined>) {
  return values.filter(Boolean).join(" ");
}

const rootClass = "aifk-file group/file flex min-w-0 max-w-[32rem] items-center gap-[var(--aifk-file-gap,var(--aifk-density-content-gap,0.75rem))] rounded-[var(--aifk-radius-control,0.625rem)] border border-[var(--aifk-border,ButtonBorder)] bg-[var(--aifk-surface-elevated,Canvas)] px-[var(--aifk-file-padding-inline,var(--aifk-space-3,0.75rem))] py-[var(--aifk-file-padding-block,var(--aifk-space-2,0.5rem))] font-[inherit] text-[var(--aifk-text,CanvasText)] transition-[border-color,background-color] duration-[var(--aifk-motion-duration-fast,120ms)] ease-out data-[variant=ghost]:border-transparent data-[variant=ghost]:bg-transparent data-[variant=muted]:border-transparent data-[variant=muted]:bg-[var(--aifk-surface-subtle,Canvas)] data-[size=sm]:gap-[var(--aifk-space-2,0.5rem)] data-[size=sm]:px-[var(--aifk-space-2,0.5rem)] data-[size=sm]:py-[var(--aifk-space-1,0.25rem)] data-[size=sm]:text-[length:var(--aifk-type-font-size-sm,0.875rem)] data-[size=lg]:gap-[var(--aifk-space-4,1rem)] data-[size=lg]:px-[var(--aifk-space-4,1rem)] data-[size=lg]:py-[var(--aifk-space-3,0.75rem)] data-[status=loading]:border-dashed data-[status=failed]:border-[var(--aifk-destructive,currentColor)] max-[30rem]:w-full max-[30rem]:max-w-full motion-reduce:duration-0 forced-colors:border-[CanvasText]";
const iconClass = "aifk-file__icon grid size-9 shrink-0 place-items-center rounded-[var(--aifk-radius-medium,0.625rem)] bg-[var(--aifk-surface,Canvas)] text-[var(--aifk-text-muted,GrayText)] group-data-[size=sm]/file:size-8 group-data-[size=lg]/file:size-11 [&_svg]:size-[1.125rem]";
const detailsClass = "aifk-file__details grid min-w-0 flex-1 gap-0.5";
const nameClass = "aifk-file__name truncate font-[var(--aifk-type-font-weight-medium,500)] leading-[1.35] text-[var(--aifk-text,CanvasText)]";
const metadataClass = "text-[length:var(--aifk-type-font-size-xs,0.75rem)] leading-[1.35] text-[var(--aifk-text-muted,GrayText)]";
const downloadClass = "aifk-file__download grid size-9 shrink-0 place-items-center rounded-[var(--aifk-radius-medium,0.625rem)] text-[var(--aifk-text-muted,GrayText)] no-underline transition-[color,background-color] duration-[var(--aifk-motion-duration-fast,120ms)] ease-[var(--aifk-motion-easing-standard,ease-out)] hover:bg-[var(--aifk-surface-subtle,Canvas)] hover:text-[var(--aifk-text,CanvasText)] active:bg-[var(--aifk-surface,Canvas)] active:text-[var(--aifk-text,CanvasText)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--aifk-focus,Highlight)] [&_svg]:size-4 pointer-coarse:min-h-11 pointer-coarse:min-w-11 motion-reduce:duration-0";

export interface FileRootProps extends ComponentPropsWithoutRef<"article"> {
  file: FileContentPart;
  variant?: FileVariant;
  size?: FileSizeValue;
}

export function FileRoot({ file, variant = "outline", size = "default", className, children, "aria-label": ariaLabel, ...props }: FileRootProps) {
  const value = { file, kind: classifyFileMediaType(file.mediaType), target: resolveFileDownloadTarget(file) };
  return (
    <FileContext.Provider value={value}>
      <article {...props} className={cx(rootClass, className)} data-slot="file" data-variant={variant} data-size={size} data-status={file.status ?? "ready"} aria-label={ariaLabel ?? `File: ${file.name}`} aria-busy={file.status === "loading"}>
        {children}
      </article>
    </FileContext.Provider>
  );
}

function KindIcon({ kind }: { kind: FileKind }) {
  if (kind === "image") return <><rect x="2.5" y="3" width="11" height="10" rx="1.5" /><path d="m4.5 11 2.4-2.6 1.8 1.8 1.3-1.3 1.5 2.1M6 6.5h.01" /></>;
  if (kind === "audio") return <><path d="M6.5 4.5v7M6.5 5l5-1v6.5" /><circle cx="4.5" cy="11.5" r="2" /><circle cx="9.5" cy="10.5" r="2" /></>;
  if (kind === "video") return <><rect x="2.5" y="3.5" width="8" height="9" rx="1.5" /><path d="m10.5 7 3-1.5v5l-3-1.5" /></>;
  if (kind === "data") return <><path d="M6 4 3.5 8 6 12M10 4l2.5 4-2.5 4M8.8 3.5 7.2 12.5" /></>;
  if (kind === "archive") return <><path d="M3 4.5h10v8H3zM5 2.5h6v2H5zM6 7h4" /></>;
  return <><path d="M4 2.5h5l3 3v8H4z" /><path d="M9 2.5v3h3M6 8h4M6 10.5h4" /></>;
}

export interface FileIconProps extends ComponentPropsWithoutRef<"span"> {
  children?: ReactNode;
}

export function FileIcon({ children, className, ...props }: FileIconProps) {
  const { file, kind } = useFile();
  return (
    <span {...props} className={cx(iconClass, file.status === "loading" ? "animate-pulse motion-reduce:animate-none" : undefined, className)} data-slot="file-icon" data-kind={kind} aria-hidden="true">
      {children ?? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><KindIcon kind={kind} /></svg>}
    </span>
  );
}

export function FileDetails({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={cx(detailsClass, className)} data-slot="file-details" />;
}

export function FileName({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  return <span {...props} className={cx(nameClass, className)} data-slot="file-name" title={typeof children === "string" ? children : file.name}>{children ?? file.name}</span>;
}

export function FileSize({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  const label = children ?? formatFileSize(file.size);
  if (!label) return null;
  return <span {...props} className={cx("aifk-file__size", metadataClass, className)} data-slot="file-size">{label}</span>;
}

export function FileStatus({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  const status = file.status ?? "ready";
  if (status === "ready" && !children) return null;
  return <span {...props} className={cx("aifk-file__status", metadataClass, status === "failed" ? "text-[var(--aifk-destructive,CanvasText)]" : undefined, className)} data-slot="file-status" role={status === "failed" ? "alert" : "status"}>{children ?? (status === "loading" ? "Preparing file" : "File unavailable")}</span>;
}

export interface FileDownloadProps extends ComponentPropsWithoutRef<"a"> {
  unavailable?: ReactNode;
}

export function FileDownload({ children, unavailable, className, ...props }: FileDownloadProps) {
  const { file, target } = useFile();
  const readyTarget = (file.status ?? "ready") === "ready" ? target : undefined;
  if (!readyTarget) return unavailable ? <span className={cx("aifk-file__unavailable max-w-32 text-end max-[30rem]:max-w-[6.5rem]", metadataClass)} data-slot="file-download-unavailable">{unavailable}</span> : null;
  return (
    <a {...props} className={cx(downloadClass, className)} data-slot="file-download" href={readyTarget} download={file.name} aria-label={`Download ${file.name}`}>
      {children ?? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M8 2.5v7m0 0 2.5-2.5M8 9.5 5.5 7M3 12.5h10" /></svg>}
    </a>
  );
}

export interface FileProps extends Omit<FileRootProps, "children"> {
  icon?: ReactNode;
  actions?: ReactNode;
}

export function FileComponent({ icon, actions, ...props }: FileProps) {
  return (
    <FileRoot {...props}>
      <FileIcon>{icon}</FileIcon>
      <FileDetails><FileName /><FileSize /><FileStatus /></FileDetails>
      {actions ?? <FileDownload />}
    </FileRoot>
  );
}

export const File = Object.assign(FileComponent, {
  Root: FileRoot,
  Icon: FileIcon,
  Details: FileDetails,
  Name: FileName,
  Size: FileSize,
  Status: FileStatus,
  Download: FileDownload,
});
