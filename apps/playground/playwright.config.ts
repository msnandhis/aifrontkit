import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  reporter: "list",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:5173",
    browserName: "chromium",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
  },
  webServer: {
    command: "pnpm --filter @aifrontkit/playground dev --host 127.0.0.1",
    url: "http://127.0.0.1:5173/docs",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [{ name: `chromium-${process.platform}` }],
});
