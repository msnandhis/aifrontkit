import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@aifrontkit/core/content": fileURLToPath(new URL("../../../packages/core/src/content/index.ts", import.meta.url)) } }
});
