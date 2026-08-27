import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/playwright-html', open: 'never' }],
    ['json', { outputFile: 'evidence/execution-results.json' }],
    [
      'allure-playwright',
      {
        resultsDir: process.env.ALLURE_RESULTS_DIR ?? 'allure-results',
        detail: true,
        suiteTitle: false,
        environmentInfo: {
          framework: 'Playwright',
          language: 'TypeScript',
          browser: 'Chromium',
          project: 'Agentic Quality Engineering Demo',
        },
      },
    ],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: process.env.PLAYWRIGHT_VIDEO === 'on' ? 'on' : 'retain-on-failure',
  },
  outputDir: 'test-results',
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/portfolio/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'portfolio-showcase',
      testMatch: '**/portfolio/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://automationexercise.com',
        headless: false,
        launchOptions: { slowMo: 800 },
        video: 'on',
      },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:4173/health',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
});
