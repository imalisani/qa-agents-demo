import { test, expect, expectOrderState } from '../fixtures/refund.js';

const invalidAmounts = [
  { name: 'missing', data: {} },
  ...[0, -1, 1.5, '4000', null, true, {}, []].map((amount) => ({
    name: JSON.stringify(amount), data: { amount },
  })),
];

for (const { name, data } of invalidAmounts) {
  test(`[RF-T13][High][R-01] invalid amount ${name} leaves financial state unchanged`, async ({ request }) => {
    const response = await request.post('/api/refunds', {
      headers: { 'Idempotency-Key': 'invalid-amount' }, data,
    });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Refund amount must be a positive integer in cents.' });
    await expectOrderState(request, 0, 0);
  });
}

for (const mode of ['absent', 'empty']) {
  test(`[RF-T14][High][R-03] ${mode} idempotency key is rejected`, async ({ request }) => {
    const response = await request.post('/api/refunds', {
      headers: mode === 'empty' ? { 'Idempotency-Key': '' } : {},
      data: { amount: 4000 },
    });
    expect(response.status()).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'Idempotency-Key header is required.' });
    await expectOrderState(request, 0, 0);
  });
}

test('[RF-T15][High][R-01] malformed JSON is rejected without mutation', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'bad-json', 'Content-Type': 'application/json' },
    data: Buffer.from('{"amount":'),
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: 'Request body must be valid JSON.' });
  await expectOrderState(request, 0, 0);
});

test('[RF-T16][High][R-01][R-04] successful API contract at the paid-total boundary', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'full-contract' }, data: { amount: 12000 },
  });
  expect(response.status()).toBe(201);
  expect(response.headers()['content-type']).toContain('application/json');
  const refund = await response.json();
  expect(refund).toEqual({
    id: expect.any(String), orderId: 'order-refund-demo', amount: 12000,
    allocation: { card: 9000, credit: 3000 }, status: 'PENDING', idempotencyKey: 'full-contract',
  });
  expect(refund.id.length).toBeGreaterThan(0);
  await expectOrderState(request, 12000, 1);
  await expect((await request.get('/api/refunds')).json()).resolves.toEqual([refund]);
});

test('[RF-T17][Low] unknown API route returns a JSON 404', async ({ request }) => {
  const response = await request.get('/api/does-not-exist');
  expect(response.status()).toBe(404);
  expect(response.headers()['content-type']).toContain('application/json');
  await expect(response.json()).resolves.toEqual({ error: 'Not found' });
});
