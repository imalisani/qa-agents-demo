import { AxeBuilder } from '@axe-core/playwright';
import { test, expect } from '../fixtures/refund.js';

test('[RF-T23][High] initial and submitted states have no serious or critical axe violations', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByTestId('paid')).toHaveText('$120.00');
  for (const state of ['initial', 'submitted']) {
    if (state === 'submitted') {
      await page.getByLabel('Refund amount').fill('40');
      await page.getByRole('button', { name: 'Request partial refund' }).click();
      await expect(page.getByTestId('remaining')).toHaveText('$80.00');
    }
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    await testInfo.attach(`axe-${state}`, { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
    expect(results.violations.filter((issue) => ['serious', 'critical'].includes(issue.impact ?? ''))).toEqual([]);
  }
});

test('[RF-T24][High] keyboard navigation and live status support submitting a refund', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('paid')).toHaveText('$120.00');
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Refund amount')).toBeFocused();
  await page.keyboard.type('40');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Request partial refund' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Request full refund' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText('submitted for $40.00');
  await expect(page.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
});
