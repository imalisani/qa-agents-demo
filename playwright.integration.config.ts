import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/integration',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-integration', open: 'never' }],
    ['json', { outputFile: 'evidence/raw/integration.json' }],
    ['allure-playwright', { resultsDir: 'allure-results/current', suiteTitle: false }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  outputDir: 'test-results/integration',
  webServer: {
    command: 'node app/server.mjs',
    url: 'http://127.0.0.1:4175/health',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: '4175', ENABLE_PROVIDER_SIMULATOR: 'true' },
  },
});
