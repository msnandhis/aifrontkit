import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@aifrontkit/react/conversation": fileURLToPath(new URL("../../packages/react/dist/conversation/index.js", import.meta.url)),
      "@aifrontkit/react/composer": fileURLToPath(new URL("../../packages/react/dist/composer/index.js", import.meta.url)),
      "@aifrontkit/react/message": fileURLToPath(new URL("../../packages/react/dist/message/index.js", import.meta.url))
    }
  }
});
