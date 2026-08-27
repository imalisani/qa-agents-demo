import { expect, test } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  await request.post('/api/reset');
});

test('[RF-T01][Critical][R-01] full refund never exceeds the paid amount', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('paid')).toHaveText('$120.00');
  await page.getByRole('button', { name: 'Request full refund' }).click();

  await expect(page.getByRole('status')).toContainText('submitted for $120.00');
  await expect(page.getByTestId('refunded')).toHaveText('$120.00');
  await expect(page.getByTestId('remaining')).toHaveText('$0.00');
  await expect(page.getByText('$120.00 · PENDING · card $90.00 · credit $30.00')).toBeVisible();
});
