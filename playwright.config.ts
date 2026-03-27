import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.TEST_PORT || "3005";
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command:
      `CANVA_API_BASE_URL=http://127.0.0.1:4010/rest/v1 ` +
      `CANVA_TOKEN_URL=http://127.0.0.1:4010/rest/v1/oauth/token ` +
      `CANVA_CLIENT_ID=test-client-id ` +
      `CANVA_CLIENT_SECRET=test-client-secret ` +
      `CANVA_ACCESS_TOKEN=test-access-token ` +
      `CANVA_REFRESH_TOKEN=test-refresh-token ` +
      `npm run dev -- --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
