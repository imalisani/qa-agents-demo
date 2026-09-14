import { defineConfig } from '@playwright/test';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required for PostgreSQL data tests.');

export default defineConfig({
  testDir: './tests/data',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-data', open: 'never' }],
    ['json', { outputFile: 'evidence/raw/data.json' }],
    ['allure-playwright', { resultsDir: 'allure-results/current', suiteTitle: false }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4174',
    trace: 'retain-on-failure',
  },
  outputDir: 'test-results/data',
  webServer: {
    command: 'node app/server.mjs',
    url: 'http://127.0.0.1:4174/health',
    reuseExistingServer: false,
    timeout: 30_000,
    env: { PORT: '4174', PERSISTENCE_MODE: 'postgres', DATABASE_URL: process.env.DATABASE_URL },
  },
});
