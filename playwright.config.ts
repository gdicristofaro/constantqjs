import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for the accessibility (axe) end-to-end suite.
 * Tests live in ./e2e (kept out of src so Angular's vitest unit runner ignores them) and
 * run against a freshly booted `ng serve`.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    // ng serve can take a while to compile on a cold start.
    timeout: 180_000,
  },
});
