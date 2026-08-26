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
    resolveId(id) { return id === searchModuleId ? `\0${searchModuleId}` : null; },
    load(id) {
      if (id !== `\0${searchModuleId}`) return null;
      const sources = Object.fromEntries(markdownFiles(docsRoot).map((path) => [relative(docsRoot, path).replaceAll("\\", "/"), readFileSync(path, "utf8")]));
      return `export default ${JSON.stringify(sources)};`;
    },
  };
}

export default defineConfig({
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
      { find: "@aifrontkit/react/conversation", replacement: fileURLToPath(new URL("../../packages/react/dist/conversation/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/composer", replacement: fileURLToPath(new URL("../../packages/react/dist/composer/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/message", replacement: fileURLToPath(new URL("../../packages/react/dist/message/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/tool", replacement: fileURLToPath(new URL("../../packages/react/dist/tool/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/testing$/, replacement: fileURLToPath(new URL("../../packages/testing/dist/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/react$/, replacement: fileURLToPath(new URL("../../packages/react/dist/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/core$/, replacement: fileURLToPath(new URL("../../packages/core/dist/index.js", import.meta.url)) }
    ]
  }
});
