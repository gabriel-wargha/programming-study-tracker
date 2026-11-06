import { defineConfig, devices } from "@playwright/test";

const devUrl = "http://127.0.0.1:3100";
const productionUrl = "http://127.0.0.1:3101";
// Browser tests use their own local database, separate from your dev data.
const e2eEnv = { LOCAL_OWNER_MODE: "1", PGLITE_DATA_DIR: ".data/e2e", NEXT_E2E_DIST_DIR: ".next-e2e" };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  // Every test acts as the same local owner, so tests share data and run one at a time.
  workers: 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: "list",
  use: { trace: "retain-on-failure" },
  projects: [
    { name: "desktop", testIgnore: /production/, use: { ...devices["Desktop Chrome"], baseURL: devUrl } },
    { name: "mobile", testIgnore: /production/, use: { ...devices["Pixel 7"], baseURL: devUrl } },
    { name: "production", testMatch: /production/, use: { ...devices["Desktop Chrome"], baseURL: productionUrl } },
  ],
  webServer: [
    {
      command: "npm run db:reset && npx next dev --hostname 127.0.0.1 --port 3100",
      url: `${devUrl}/login`,
      env: e2eEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // The local owner flag is set on purpose: a production server must ignore it.
      command: "npm run build && npx next start --hostname 127.0.0.1 --port 3101",
      url: `${productionUrl}/login`,
      env: e2eEnv,
      reuseExistingServer: !process.env.CI,
      timeout: 300_000,
    },
  ],
});
