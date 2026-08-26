"use client";

import { createContext, useContext, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { classifyFileMediaType, formatFileSize, resolveFileDownloadTarget, type FileContentPart, type FileKind } from "@aifrontkit/core/content";
import styles from "./file.module.css";

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

function slot(name: string, ...values: Array<string | undefined>) {
  return [styles[name], name, ...values].filter(Boolean).join(" ");
}

export interface FileRootProps extends ComponentPropsWithoutRef<"article"> {
  file: FileContentPart;
  variant?: FileVariant;
  size?: FileSizeValue;
}

export function FileRoot({ file, variant = "outline", size = "default", className, children, "aria-label": ariaLabel, ...props }: FileRootProps) {
  const value = { file, kind: classifyFileMediaType(file.mediaType), target: resolveFileDownloadTarget(file) };
  return (
    <FileContext.Provider value={value}>
      <article {...props} className={slot("aifk-file", className)} data-slot="file" data-variant={variant} data-size={size} data-status={file.status ?? "ready"} aria-label={ariaLabel ?? `File: ${file.name}`} aria-busy={file.status === "loading"}>
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
  const { kind } = useFile();
  return (
    <span {...props} className={slot("aifk-file__icon", className)} data-slot="file-icon" data-kind={kind} aria-hidden="true">
      {children ?? <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round"><KindIcon kind={kind} /></svg>}
    </span>
  );
}

export function FileDetails({ className, ...props }: ComponentPropsWithoutRef<"div">) {
  return <div {...props} className={slot("aifk-file__details", className)} data-slot="file-details" />;
}

export function FileName({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  return <span {...props} className={slot("aifk-file__name", className)} data-slot="file-name" title={typeof children === "string" ? children : file.name}>{children ?? file.name}</span>;
}

export function FileSize({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  const label = children ?? formatFileSize(file.size);
  if (!label) return null;
  return <span {...props} className={slot("aifk-file__size", className)} data-slot="file-size">{label}</span>;
}

export function FileStatus({ children, className, ...props }: ComponentPropsWithoutRef<"span">) {
  const { file } = useFile();
  const status = file.status ?? "ready";
  if (status === "ready" && !children) return null;
  return <span {...props} className={slot("aifk-file__status", className)} data-slot="file-status" role={status === "failed" ? "alert" : "status"}>{children ?? (status === "loading" ? "Preparing file" : "File unavailable")}</span>;
}

export interface FileDownloadProps extends ComponentPropsWithoutRef<"a"> {
  unavailable?: ReactNode;
}

export function FileDownload({ children, unavailable, className, ...props }: FileDownloadProps) {
  const { file, target } = useFile();
  const readyTarget = (file.status ?? "ready") === "ready" ? target : undefined;
  if (!readyTarget) return unavailable ? <span className={slot("aifk-file__unavailable")} data-slot="file-download-unavailable">{unavailable}</span> : null;
  return (
    <a {...props} className={slot("aifk-file__download", className)} data-slot="file-download" href={readyTarget} download={file.name} aria-label={`Download ${file.name}`}>
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
  Download: FileDownload
});
