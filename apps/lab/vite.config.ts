import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      { find: "@aifrontkit/core/content", replacement: fileURLToPath(new URL("../../packages/core/dist/content/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/conversation", replacement: fileURLToPath(new URL("../../packages/react/dist/conversation/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/composer", replacement: fileURLToPath(new URL("../../packages/react/dist/composer/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/message", replacement: fileURLToPath(new URL("../../packages/react/dist/message/index.js", import.meta.url)) },
      { find: "@aifrontkit/react/tool", replacement: fileURLToPath(new URL("../../packages/react/dist/tool/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/react$/, replacement: fileURLToPath(new URL("../../packages/react/dist/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/core$/, replacement: fileURLToPath(new URL("../../packages/core/dist/index.js", import.meta.url)) },
      { find: /^@aifrontkit\/testing$/, replacement: fileURLToPath(new URL("../../packages/testing/dist/index.js", import.meta.url)) }
    ]
  }
});
