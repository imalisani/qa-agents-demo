import { expect, test, expectOrderState } from '../fixtures/refund.js';

test('[RF-T04][Critical][R-03] retrying the same request does not duplicate a refund', async ({ request }) => {
  const requestOptions = {
    headers: { 'Idempotency-Key': 'stable-refund-key' },
    data: { amount: 4000 },
  };

  const initial = await request.post('/api/refunds', requestOptions);
  const retry = await request.post('/api/refunds', requestOptions);

  expect(initial.status()).toBe(201);
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toEqual(await initial.json());

  const refunds = await request.get('/api/refunds');
  expect(await refunds.json()).toHaveLength(1);
  await expectOrderState(request, 4000, 1);
});

test('[RF-T05][Critical][R-01] a single refund above paid amount is rejected without side effects', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'over-refund-key' },
    data: { amount: 12001 },
  });

  expect(response.status()).toBe(409);
  const order = await request.get('/api/order');
  await expect(order.json()).resolves.toMatchObject({ refunded: 0, refundableRemaining: 12000 });
  await expectOrderState(request, 0, 0);
});

test('[RF-T06][High][R-04] generated refund state belongs to the accepted state model', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'state-model-key' },
    data: { amount: 1000 },
  });

  expect(response.status()).toBe(201);
  const refund = await response.json();
  expect(['PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_REFUNDED']).toContain(refund.status);
});
