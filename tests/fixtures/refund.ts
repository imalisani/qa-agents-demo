import { test as base, expect, type APIRequestContext } from '@playwright/test';

// The demo has one in-memory order: use one worker and reset before every test.
export const test = base.extend<{ resetOrder: void }>({
  resetOrder: [async ({ request }, use) => {
    const reset = await request.post('/api/reset');
    expect(reset.status()).toBe(200);
    await expect(reset.json()).resolves.toEqual({ reset: true });
    await use();
  }, { auto: true }],
});
export { expect };

export async function expectOrderState(request: APIRequestContext, refunded: number, count: number) {
  const order = await request.get('/api/order');
  expect(order.status()).toBe(200);
  await expect(order.json()).resolves.toEqual({
    id: 'order-refund-demo', paid: 12000,
    payment: { card: 9000, credit: 3000 },
    refunded, refundableRemaining: 12000 - refunded,
  });
  const history = await request.get('/api/refunds');
  expect(history.status()).toBe(200);
  await expect(history.json()).resolves.toHaveLength(count);
}
