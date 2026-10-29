import { defineConfig, devices } from "@playwright/test";

// Spec §27.1 "E2E web": critical journeys + axe on key pages. Runs against a running stack
// (local or staging) seeded with `npm run e2e:fixtures` in the API repo — see e2e/README.md.
const all = process.env.E2E_ALL_BROWSERS === "1";

export default defineConfig({
  testDir: "./e2e",
  // The dev database can be a region away: allow for slow round trips.
  timeout: 120_000,
  expect: { timeout: 30_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Public and student pages on a phone (Pixel 7 profile).
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /public|student/ },
    ...(all
      ? [
          { name: "firefox", use: { ...devices["Desktop Firefox"] }, testMatch: /public/ },
          { name: "webkit", use: { ...devices["Desktop Safari"] }, testMatch: /public/ },
          { name: "iphone", use: { ...devices["iPhone 14"] }, testMatch: /public/ },
        ]
      : []),
  ],
});
