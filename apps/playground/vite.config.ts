import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    alias: {
      "@aifrontkit/react/message": fileURLToPath(new URL("../../packages/react/dist/message/index.js", import.meta.url))
    }
  }
});
