import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SimulatedRefundProvider } from '../app/refund-provider-simulator.mjs';

test('[RF-U05] simulated provider exposes only documented deterministic scenarios', async () => {
  const provider = new SimulatedRefundProvider({ delayMs: 1 });
  assert.deepEqual(
    await provider.process({ idempotencyKey: 'success', scenario: 'success' }),
    { accepted: true, status: 'APPROVED', httpStatus: 201, outcome: 'confirmed' },
  );
  assert.deepEqual(
    await provider.process({ idempotencyKey: 'failure', scenario: 'failure' }),
    { accepted: false, httpStatus: 502, error: 'Simulated provider rejected the refund.' },
  );
  assert.deepEqual(
    await provider.process({ idempotencyKey: 'before', scenario: 'timeout-before-acceptance' }),
    { accepted: false, httpStatus: 504, error: 'Simulated provider timed out before acceptance.' },
  );
  assert.deepEqual(
    await provider.process({ idempotencyKey: 'after', scenario: 'timeout-after-acceptance' }),
    { accepted: true, status: 'PENDING', httpStatus: 202, outcome: 'unknown' },
  );
  assert.deepEqual(
    await provider.process({ idempotencyKey: 'unknown', scenario: 'unsupported' }),
    { accepted: false, httpStatus: 400, error: 'Unsupported simulated provider scenario.' },
  );
});

test('[RF-U06] transient provider failure recovers once and reset restores the first attempt', async () => {
  const provider = new SimulatedRefundProvider();
  const input = { idempotencyKey: 'transient', scenario: 'transient-failure' };
  assert.equal((await provider.process(input)).httpStatus, 503);
  assert.equal((await provider.process(input)).httpStatus, 201);
  provider.reset();
  assert.equal((await provider.process(input)).httpStatus, 503);
});

test('[RF-U07] delayed provider success waits before returning a confirmed outcome', async () => {
  const provider = new SimulatedRefundProvider({ delayMs: 5 });
  const startedAt = Date.now();
  const result = await provider.process({ idempotencyKey: 'delayed', scenario: 'delayed-success' });
  assert.ok(Date.now() - startedAt >= 4);
  assert.equal(result.status, 'APPROVED');
});
