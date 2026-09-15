import * as allure from 'allure-js-commons';
import { test, expect, expectOrderState } from '../fixtures/refund.js';

test('[BUG-SHOWCASE][CONTROLLED-DEFECT][High] partial refund displays stale remaining amount', async ({ page, request }, testInfo) => {
  await allure.feature('Refund');
  await allure.story('Partial refund balance');
  await allure.severity('high');
  await allure.label('type', 'Controlled defect showcase');
  await allure.tags('controlled-defect', 'portfolio-showcase');
  await allure.description(
    'This failure is intentionally reproduced through test-level response manipulation for portfolio demonstration. It is not an unresolved defect in the current application.',
  );

  await page.goto('/');
  await expect(page.getByTestId('paid')).toHaveText('$120.00');
  await expect(page.getByTestId('remaining')).toHaveText('$120.00');

  let controlledDefectActive = false;
  await page.route('**/api/order', async (route) => {
    const response = await route.fetch();
    if (!controlledDefectActive) {
      await route.fulfill({ response });
      return;
    }

    const order = await response.json();
    await route.fulfill({
      response,
      json: { ...order, refundableRemaining: 12000 },
    });
  });
  controlledDefectActive = true;

  await page.getByLabel('Refund amount').fill('40');
  await page.getByRole('button', { name: 'Request partial refund' }).click();
  await expect(page.getByRole('status')).toContainText('submitted for $40.00');

  // The domain/API state remains correct; only the browser response is intentionally stale.
  await expectOrderState(request, 4000, 1);

  await testInfo.attach('bug-context.json', {
    body: JSON.stringify({
      showcase: 'controlled-defect',
      feature: 'partial refund',
      orderTotal: '$120.00',
      refundRequested: '$40.00',
      expectedRemaining: '$80.00',
      simulatedActualRemaining: '$120.00',
      businessImpact: 'Customer sees an incorrect refundable balance after a successful partial refund.',
    }, null, 2),
    contentType: 'application/json',
  });

  await expect(page.getByTestId('remaining')).toHaveText('$80.00');
});
