import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/showcase',
  testMatch: '**/bug-reporting.spec.ts',
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-bug-showcase', open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results/bug-showcase',
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          framework: 'Playwright',
          language: 'TypeScript',
          browser: 'Chromium',
          project: 'Agentic Quality Engineering Lab - Controlled Defect Showcase',
        },
      },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  outputDir: 'test-results/bug-showcase',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'node app/server.mjs',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
