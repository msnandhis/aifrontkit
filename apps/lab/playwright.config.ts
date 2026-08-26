import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  reporter: [["list"], ["html", { outputFolder: "./playwright-report", open: "never" }]],
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{arg}{ext}",
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.01, threshold: 0.2 }
  },
  use: {
    baseURL: "http://127.0.0.1:5174",
    browserName: "chromium",
    colorScheme: "light",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 }
  },
  webServer: {
    command: "pnpm --filter @aifrontkit/lab dev --host 127.0.0.1",
    url: "http://127.0.0.1:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  },
  projects: [{ name: `chromium-${process.platform}` }]
});
