import { expect, test } from '@playwright/test';

test('[CI-T01] published Allure report matches this commit and contains visible suites', async ({ page, request }) => {
  const revision = `${process.env.GITHUB_RUN_ID}-${Date.now()}`;
  await expect(async () => {
    const response = await request.get(`provenance.json?revision=${revision}`, { timeout: 15_000 });
    expect(response.status()).toBe(200);
    const provenance = await response.json();
    expect(provenance.commit).toBe(process.env.GITHUB_SHA);
    expect(provenance.runId).toBe(process.env.GITHUB_RUN_ID);
    expect(provenance.tests.total).toBeGreaterThan(0);
    expect(provenance.tests.failed).toBe(0);
    expect(provenance.tests.broken).toBe(0);
  }).toPass({ timeout: 120_000, intervals: [2000, 5000, 10000] });
  const response = await page.goto(`index.html?revision=${revision}#suites`);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Allure/);
  await page.getByText('chromium', { exact: true }).click();
  await expect(page.getByText(/RF-T/).first()).toBeVisible();
});
