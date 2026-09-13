import { defineConfig, devices } from '@playwright/test';

if (!process.env.REPORT_URL) throw new Error('REPORT_URL is required for deployment checks.');
if (!process.env.GITHUB_SHA || !process.env.GITHUB_RUN_ID) throw new Error('GITHUB_SHA and GITHUB_RUN_ID are required to verify report provenance.');

export default defineConfig({
  testDir: './deployment-tests',
  timeout: 180_000,
  retries: 0,
  workers: 1,
  forbidOnly: true,
  outputDir: 'test-results-deploy',
  reporter: [['list'], ['html', { outputFolder: 'reports/deployment-html', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    baseURL: process.env.REPORT_URL.endsWith('/') ? process.env.REPORT_URL : `${process.env.REPORT_URL}/`,
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
});
