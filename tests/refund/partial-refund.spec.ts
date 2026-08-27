import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/reset');
});

test('[RF-T02][High][R-02] partial refund is allocated proportionally', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Refund amount').fill('40');
  await page.getByRole('button', { name: 'Request partial refund' }).click();

  await expect(page.getByRole('status')).toContainText('submitted for $40.00');
  await expect(page.getByText('$40.00 · PENDING · card $30.00 · credit $10.00')).toBeVisible();
  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
});

test('[RF-T03][Critical][R-01] cumulative partial refunds cannot exceed amount paid', async ({ request }) => {
  const first = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'partial-first' },
    data: { amount: 7000 },
  });
  expect(first.status()).toBe(201);

  const second = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'partial-second' },
    data: { amount: 5000 },
  });
  expect(second.status()).toBe(201);

  const excessive = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'partial-excessive' },
    data: { amount: 1 },
  });
  expect(excessive.status()).toBe(409);
  await expect(excessive.json()).resolves.toEqual({ error: 'Refund total cannot exceed the amount actually paid.' });
});
