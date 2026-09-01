import { fileURLToPath } from "node:url";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import mdx from "@mdx-js/rollup";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

const docsRoot = fileURLToPath(new URL("../../content/docs", import.meta.url));
const searchModuleId = "virtual:aifrontkit-docs-search";
const metadataModuleId = "virtual:aifrontkit-docs-metadata";

function parseFrontmatter(source: string, file: string) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) throw new Error(`Documentation page is missing frontmatter: ${file}`);
  const values = Object.fromEntries(match[1]!.split(/\r?\n/).flatMap((line) => {
    const separator = line.indexOf(":");
    if (separator < 0) return [];
    const key = line.slice(0, separator).trim();
    const raw = line.slice(separator + 1).trim();
    const value = raw.replace(/^(?:"([\s\S]*)"|'([\s\S]*)')$/, "$1$2");
    return [[key, value]];
  }));
  if (!values.title || !values.description) throw new Error(`Documentation page requires title and description frontmatter: ${file}`);
  return {
    title: values.title,
    description: values.description,
    ...(values.status ? { status: values.status } : {}),
  };
}

function documentationSearchPlugin(): Plugin {
  function markdownFiles(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) return markdownFiles(path);
      return entry.isFile() && entry.name.endsWith(".md") ? [path] : [];
    });
  }

  return {
    name: "aifrontkit-documentation-search",
    resolveId(id) { return id === searchModuleId || id === metadataModuleId ? `\0${id}` : null; },
    load(id) {
      if (id !== `\0${searchModuleId}` && id !== `\0${metadataModuleId}`) return null;
      const documents = markdownFiles(docsRoot).map((path) => {
        const file = relative(docsRoot, path).replaceAll("\\", "/");
        const source = readFileSync(path, "utf8");
        return { file, source, frontmatter: parseFrontmatter(source, file) };
      });
      const entries = id === `\0${searchModuleId}`
        ? Object.fromEntries(documents.map(({ file, source }) => [file, source]))
        : Object.fromEntries(documents.map(({ file, frontmatter }) => [file, frontmatter]));
      return `export default ${JSON.stringify(entries)};`;
    },
  };
}

export default defineConfig({
  build: {
    manifest: true,
  },
  plugins: [
    documentationSearchPlugin(),
    mdx({
      include: /\.mdx?$/,
      providerImportSource: "@mdx-js/react",
      remarkPlugins: [remarkFrontmatter, remarkGfm, [remarkMdxFrontmatter, { name: "frontmatter" }]],
    }),
    react(),
  ],
  resolve: {
    alias: [
      { find: /^@mdx-js\/react$/, replacement: fileURLToPath(new URL("./node_modules/@mdx-js/react/index.js", import.meta.url)) },
      { find: "@aifrontkit/core/content", replacement: fileURLToPath(new URL("../../packages/core/dist/content/index.js", import.meta.url)) },
      { find: "@aifrontkit/core/testing", replacement: fileURLToPath(new URL("../../packages/core/dist/testing/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/conversation", replacement: fileURLToPath(new URL("../../packages/react/dist/conversation/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/composer", replacement: fileURLToPath(new URL("../../packages/react/dist/composer/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/message", replacement: fileURLToPath(new URL("../../packages/react/dist/message/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/tool", replacement: fileURLToPath(new URL("../../packages/react/dist/tool/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/task", replacement: fileURLToPath(new URL("../../packages/react/dist/task/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/approval", replacement: fileURLToPath(new URL("../../packages/react/dist/approval/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/artifact", replacement: fileURLToPath(new URL("../../packages/react/dist/artifact/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/attachment", replacement: fileURLToPath(new URL("../../packages/react/dist/attachment/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/checkpoint", replacement: fileURLToPath(new URL("../../packages/react/dist/checkpoint/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/connection", replacement: fileURLToPath(new URL("../../packages/react/dist/connection/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/react$/, replacement: fileURLToPath(new URL("../../packages/react/dist/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/core$/, replacement: fileURLToPath(new URL("../../packages/core/dist/index.js", import.meta.url)) }
    ]
  }
});
