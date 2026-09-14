import { test, expect, expectOrderState } from '../fixtures/refund.js';

test('[Security][RF-T31][Critical] server-owned financial and state fields cannot be injected', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'server-owned-fields' },
    data: {
      amount: 4000,
      id: 'attacker-refund', orderId: 'other-order', status: 'APPROVED',
      allocation: { card: 0, credit: 4000 }, idempotencyKey: 'body-key',
      unexpected: { privileged: true },
    },
  });
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toEqual({
    id: 'refund-1', orderId: 'order-refund-demo', amount: 4000,
    allocation: { card: 3000, credit: 1000 }, status: 'PENDING',
    idempotencyKey: 'server-owned-fields',
  });
});

test('[Security][RF-T32][Critical][R-03] an idempotency key cannot be replayed with changed input', async ({ request }) => {
  const headers = { 'Idempotency-Key': 'payload-bound-key' };
  expect((await request.post('/api/refunds', { headers, data: { amount: 4000 } })).status()).toBe(201);
  const changed = await request.post('/api/refunds', { headers, data: { amount: 5000 } });
  expect(changed.status()).toBe(409);
  await expect(changed.json()).resolves.toEqual({
    error: 'Idempotency-Key cannot be reused with a different refund amount.',
  });
  await expectOrderState(request, 4000, 1);
});

test('[Security][RF-T33][High] unsupported content types fail closed without mutation', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'wrong-content-type', 'Content-Type': 'text/plain' },
    data: Buffer.from('{"amount":4000}'),
  });
  expect(response.status()).toBe(415);
  await expect(response.json()).resolves.toEqual({ error: 'Content-Type must be application/json.' });
  await expectOrderState(request, 0, 0);
});

test('[Security][RF-T34][High] oversized request bodies are rejected without mutation', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'oversized', 'Content-Type': 'application/json' },
    data: Buffer.from(JSON.stringify({ amount: 4000, padding: 'x'.repeat(17 * 1024) })),
  });
  expect(response.status()).toBe(413);
  await expect(response.json()).resolves.toEqual({ error: 'Request body is too large.' });
  await expectOrderState(request, 0, 0);
});

test('[Security][RF-T35][High] excessively long idempotency keys are rejected', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'x'.repeat(201) }, data: { amount: 4000 },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: 'Idempotency-Key must not exceed 200 characters.' });
  await expectOrderState(request, 0, 0);
});

test('[Security][RF-T36][High] simulated dependency controls are disabled by default', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: {
      'Idempotency-Key': 'disabled-simulator',
      'X-Simulated-Provider-Scenario': 'success',
    },
    data: { amount: 4000 },
  });
  expect(response.status()).toBe(400);
  await expect(response.json()).resolves.toEqual({ error: 'Simulated provider scenarios are disabled.' });
  await expectOrderState(request, 0, 0);
});

test('[Security][RF-T37][Medium] prototype-shaped input cannot alter server state', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'prototype-input', 'Content-Type': 'application/json' },
    data: Buffer.from('{"amount":1000,"__proto__":{"status":"APPROVED"}}'),
  });
  expect(response.status()).toBe(201);
  await expect(response.json()).resolves.toMatchObject({ amount: 1000, status: 'PENDING' });
  await expectOrderState(request, 1000, 1);
});
