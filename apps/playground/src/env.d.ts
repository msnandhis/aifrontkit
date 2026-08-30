/// <reference types="vite/client" />

declare module "*.md" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    description: string;
    status?: string;
  };
  const Content: ComponentType;
  export default Content;
}

declare module "virtual:aifrontkit-docs-search" {
  const sources: Record<string, string>;
  export default sources;
}

declare module "virtual:aifrontkit-docs-metadata" {
  const metadata: Record<string, {
    title: string;
    description: string;
    status?: string;
  }>;
  export default metadata;
}
