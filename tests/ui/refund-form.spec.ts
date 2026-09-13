import { test, expect, expectOrderState } from '../fixtures/refund.js';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('paid')).toHaveText('$120.00');
});

test('[RF-T18][Medium] initial summary and history agree', async ({ page }) => {
  await expect(page.getByTestId('refunded')).toHaveText('$0.00');
  await expect(page.getByTestId('remaining')).toHaveText('$120.00');
  await expect(page.getByRole('listitem')).toHaveText(['No refunds requested.']);
});

test('[RF-T19][Critical][R-01] partial then full refunds only the remainder', async ({ page, request }) => {
  await page.getByLabel('Refund amount').fill('40');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
  await page.getByRole('button', { name: 'Request full refund' }).click();
  await expect(page.getByRole('status')).toContainText('submitted for $80.00');
  await expect(page.getByTestId('refunded')).toHaveText('$120.00');
  await expect(page.getByTestId('remaining')).toHaveText('$0.00');
  await expect(page.getByRole('listitem')).toHaveText([
    '$40.00 · PENDING · card $30.00 · credit $10.00',
    '$80.00 · PENDING · card $60.00 · credit $20.00',
  ]);
  await expectOrderState(request, 12000, 2);
});

test('[RF-T20][High][R-01] over-refund error leaves visible and API totals unchanged', async ({ page, request }) => {
  await page.getByLabel('Refund amount').fill('120.01');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  await expect(page.getByRole('status')).toHaveText('Refund total cannot exceed the amount actually paid.');
  await expect(page.getByTestId('refunded')).toHaveText('$0.00');
  await expect(page.getByTestId('remaining')).toHaveText('$120.00');
  await expect(page.getByRole('listitem')).toHaveText(['No refunds requested.']);
  await expectOrderState(request, 0, 0);
});

for (const input of ['', '0', '-1', 'abc', '40abc', '40.001']) {
  test(`[RF-T21][High][R-01] input ${JSON.stringify(input)} never sends a refund`, async ({ page, request }) => {
    const sent: string[] = [];
    page.on('request', (req) => {
      if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/refunds') sent.push(req.postData() ?? '');
    });
    const amount = page.getByLabel('Refund amount');
    await amount.fill(input);
    await page.getByRole('button', { name: 'Request partial refund' }).click();
    expect(await amount.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
    await expect(amount).toBeFocused();
    await expectOrderState(request, 0, 0);
    expect(sent).toEqual([]);
  });
}

test('[RF-T22][Medium] reload preserves the current server-session refund', async ({ page, request }) => {
  await page.getByLabel('Refund amount').fill('40');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
  await page.reload();
  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
  await expect(page.getByTestId('refunded')).toHaveText('$40.00');
  await expect(page.getByRole('listitem')).toHaveText(['$40.00 · PENDING · card $30.00 · credit $10.00']);
  await expectOrderState(request, 4000, 1);
});

test('[RF-T25][High][R-01] corrected input accepts exact cents after a validation error', async ({ page, request }) => {
  const amount = page.getByLabel('Refund amount');
  await amount.fill('0');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  expect(await amount.evaluate((element: HTMLInputElement) => element.validity.valid)).toBe(false);
  await amount.fill('40.04');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  await expect(page.getByRole('status')).toContainText('submitted for $40.04');
  await expect(page.getByRole('listitem')).toHaveText(['$40.04 · PENDING · card $30.03 · credit $10.01']);
  await expectOrderState(request, 4004, 1);
});
