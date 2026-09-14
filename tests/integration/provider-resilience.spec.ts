import { test, expect, expectOrderState } from '../fixtures/refund.js';

const providerHeaders = (idempotencyKey: string, scenario: string) => ({
  'Idempotency-Key': idempotencyKey,
  'X-Simulated-Provider-Scenario': scenario,
});

test('[Integration][RF-T26][High][R-06] confirmed provider success is persisted once', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: providerHeaders('provider-success', 'success'), data: { amount: 4000 },
  });
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({ amount: 4000, status: 'APPROVED' });
  await expectOrderState(request, 4000, 1);
});

test('[Integration][RF-T27][Medium][R-06] delayed success remains deterministic', async ({ request }) => {
  const startedAt = Date.now();
  const response = await request.post('/api/refunds', {
    headers: providerHeaders('provider-delayed', 'delayed-success'), data: { amount: 1000 },
  });
  expect(response.status()).toBe(201);
  expect(Date.now() - startedAt).toBeGreaterThanOrEqual(100);
  await expect(response.json()).resolves.toMatchObject({ status: 'APPROVED' });
  await expectOrderState(request, 1000, 1);
});

for (const scenario of ['failure', 'timeout-before-acceptance']) {
  test(`[Integration][RF-T28][High][R-06] ${scenario} creates no local financial effect`, async ({ request }) => {
    const response = await request.post('/api/refunds', {
      headers: providerHeaders(`provider-${scenario}`, scenario), data: { amount: 4000 },
    });
    expect([502, 504]).toContain(response.status());
    await expectOrderState(request, 0, 0);
  });
}

test('[Integration][RF-T29][Critical][R-03][R-06] unknown accepted outcome is replay-safe', async ({ request }) => {
  const options = {
    headers: providerHeaders('provider-unknown', 'timeout-after-acceptance'), data: { amount: 4000 },
  };
  const initial = await request.post('/api/refunds', options);
  const retry = await request.post('/api/refunds', options);
  expect(initial.status()).toBe(202);
  expect(retry.status()).toBe(200);
  expect(await retry.json()).toEqual(await initial.json());
  await expectOrderState(request, 4000, 1);
});

test('[Integration][RF-T30][High][R-03][R-06] retry recovers from a transient pre-acceptance failure', async ({ request }) => {
  const options = {
    headers: providerHeaders('provider-transient', 'transient-failure'), data: { amount: 4000 },
  };
  const initial = await request.post('/api/refunds', options);
  const retry = await request.post('/api/refunds', options);
  expect(initial.status()).toBe(503);
  expect(retry.status()).toBe(201);
  await expect(retry.json()).resolves.toMatchObject({ status: 'APPROVED' });
  await expectOrderState(request, 4000, 1);
});
