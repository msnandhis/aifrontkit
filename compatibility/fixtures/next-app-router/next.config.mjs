import { fileURLToPath } from "node:url";

export default {
  outputFileTracingRoot: fileURLToPath(new URL("../../../", import.meta.url)),
  experimental: { externalDir: true },
  webpack(config) {
    config.resolve.alias["@aifrontkit/core/content"] = fileURLToPath(new URL("../../../packages/core/src/content/index.ts", import.meta.url));
    return config;
  }
};
