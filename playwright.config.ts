import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90000,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    browserName: "chromium",
    viewport: { width: 1440, height: 940 },
    headless: true,
    trace: "retain-on-failure",
    extraHTTPHeaders: { "x-real-ip": `e2e-${Date.now()}` },
  },
});
