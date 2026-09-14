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
    const evidenceResponse = await request.get(`qa-evidence.json?revision=${revision}`, { timeout: 15_000 });
    expect(evidenceResponse.status()).toBe(200);
    const evidence = await evidenceResponse.json();
    expect(evidence).toMatchObject({
      status: 'passed', commit: process.env.GITHUB_SHA, runId: process.env.GITHUB_RUN_ID,
      performance: { profile: 'smoke', guardrailType: 'demo/CI guardrail, not a product SLO' },
      gates: {
        unit: { status: 'passed' }, functional: { status: 'passed' },
        integration: { status: 'passed' }, security: { status: 'passed' },
        data: { status: 'passed' }, performance: { status: 'passed' },
      },
    });
    expect(evidence.tests.total).toBeGreaterThan(0);
    expect(evidence.coverage.branches).toBeGreaterThanOrEqual(90);
    expect(evidence.performance.p95Ms).toBeGreaterThanOrEqual(0);
  }).toPass({ timeout: 120_000, intervals: [2000, 5000, 10000] });
  const response = await page.goto(`index.html?revision=${revision}#suites`);
  expect(response?.status()).toBe(200);
  await expect(page).toHaveTitle(/Allure/);
  await page.getByText('chromium', { exact: true }).click();
  await expect(page.getByText(/RF-T/).first()).toBeVisible();
});
