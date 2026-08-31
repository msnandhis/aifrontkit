import type { ComponentType } from "react";
import navigationData from "../../../../content/docs/navigation.json" with { type: "json" };
import documentationMetadata from "virtual:aifrontkit-docs-metadata";

export interface DocFrontmatter {
  title: string;
  description: string;
  status?: string;
}

export interface DocModule {
  default: ComponentType;
  frontmatter: DocFrontmatter;
}

export interface DocPage extends DocFrontmatter {
  file: string;
  path: string;
  sectionId: string;
  sectionTitle: string;
  component?: "conversation" | "message" | "prompt-input" | "file" | "tool-call" | "agent-progress" | "tool-approval" | "research-agent";
  load(): Promise<DocModule>;
}

export interface DocSection {
  id: string;
  title: string;
  pages: DocPage[];
}

const modules = import.meta.glob<DocModule>("../../../../content/docs/**/*.md");

export function fileToPath(file: string) {
  const clean = file.replace(/\.md$/, "");
  if (clean === "index") return "/docs";
  if (clean.startsWith("primitives/")) return `/docs/components/${clean.slice("primitives/".length)}`;
  return `/docs/${clean}`;
}

function componentFromFile(file: string): DocPage["component"] {
  if (!file.startsWith("primitives/") && !file.startsWith("patterns/")) return undefined;
  const value = file.replace(/^primitives\//, "").replace(/^patterns\//, "").replace(/\.md$/, "");
  if (["conversation", "message", "prompt-input", "file", "tool-call", "agent-progress", "tool-approval", "research-agent"].includes(value)) {
    return value as NonNullable<DocPage["component"]>;
  }
  return undefined;
}

function loaderFor(file: string) {
  const key = Object.keys(modules).find((candidate) => candidate.endsWith(`/content/docs/${file}`));
  if (!key) throw new Error(`Documentation navigation references a missing page: ${file}`);
  return modules[key]!;
}

export const docSections: DocSection[] = navigationData.sections.map((section) => ({
  id: section.id,
  title: section.title,
  pages: section.pages.map((file) => {
    const frontmatter = documentationMetadata[file];
    if (!frontmatter) throw new Error(`Documentation metadata is missing a navigation page: ${file}`);
    const component = componentFromFile(file);
    return {
      ...frontmatter,
      file,
      path: fileToPath(file),
      sectionId: section.id,
      sectionTitle: section.title,
      ...(component ? { component } : {}),
      load: loaderFor(file),
    };
  }),
}));

export const docs = docSections.flatMap((section) => section.pages);
export const docsByPath = new Map(docs.map((doc) => [doc.path, doc]));

export function adjacentDocs(path: string) {
  const index = docs.findIndex((doc) => doc.path === path);
  return {
    previous: index > 0 ? docs[index - 1] : undefined,
    next: index >= 0 && index < docs.length - 1 ? docs[index + 1] : undefined,
  };
}
