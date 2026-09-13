import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RefundStore } from '../app/refund-store.mjs';

const initial = {
  id: 'order-refund-demo', paid: 12000, payment: { card: 9000, credit: 3000 },
  refunded: 0, refundableRemaining: 12000,
};

test('[RF-U01] reset restores financial state and clears idempotency', () => {
  const store = new RefundStore();
  assert.deepEqual(store.getOrder(), initial);
  const input = { amount: 4000, idempotencyKey: 'repeat-after-reset' };
  store.createRefund(input);
  store.reset();
  assert.deepEqual(store.getOrder(), initial);
  assert.deepEqual(store.listRefunds(), []);
  assert.equal(store.createRefund(input).created, true);
  assert.equal(store.listRefunds().length, 1);
  assert.equal(store.getOrder().refunded, 4000);
});

test('[RF-U02][R-01][R-03] partials and retries preserve the paid-total boundary and original payment', () => {
  const store = new RefundStore();
  const input = { amount: 4000, idempotencyKey: 'first' };
  const first = store.createRefund(input);
  assert.equal(first.created, true);
  assert.deepEqual(first.refund.allocation, { card: 3000, credit: 1000 });
  assert.deepEqual(store.createRefund(input), { created: false, refund: first.refund });
  assert.equal(store.getOrder().refunded, 4000);
  const last = store.createRefund({ amount: 8000, idempotencyKey: 'last' });
  assert.equal(last.created, true);
  assert.notEqual(first.refund.id, last.refund.id);
  assert.deepEqual(store.getOrder(), { ...initial, refunded: 12000, refundableRemaining: 0 });
  assert.equal(store.createRefund({ amount: 1, idempotencyKey: 'too-much' }).status, 409);
  assert.equal(store.listRefunds().length, 2);
  assert.deepEqual(store.getOrder(), { ...initial, refunded: 12000, refundableRemaining: 0 });
});

test('[RF-U03][R-01] invalid values and excess cannot change state', () => {
  const store = new RefundStore();
  for (const amount of [undefined, null, 0, -1, 1.5, '4000', true, {}, [], NaN, Infinity]) {
    const result = store.createRefund({ amount, idempotencyKey: 'invalid' });
    assert.equal(result.status, 400);
    assert.deepEqual(store.getOrder(), initial);
    assert.deepEqual(store.listRefunds(), []);
  }
  assert.equal(store.createRefund({ amount: 12001, idempotencyKey: 'invalid' }).status, 409);
  assert.deepEqual(store.getOrder(), initial);
  assert.deepEqual(store.listRefunds(), []);
  // A rejected request must not reserve a key and prevent a later valid request.
  assert.equal(store.createRefund({ amount: 4000, idempotencyKey: 'invalid' }).created, true);
});

test('[RF-U04][R-02] allocation conserves integer cents for all 12000 permitted single-refund amounts', () => {
  for (let amount = 1; amount <= 12000; amount++) {
    const store = new RefundStore();
    const result = store.createRefund({ amount, idempotencyKey: 'conservation' });
    assert.equal(result.created, true);
    const { card, credit } = result.refund.allocation;
    assert.ok(Number.isInteger(card) && card >= 0);
    assert.ok(Number.isInteger(credit) && credit >= 0);
    assert.equal(card + credit, amount);
    const order = store.getOrder();
    assert.equal(order.refunded, amount);
    assert.equal(order.refunded + order.refundableRemaining, initial.paid);
    assert.deepEqual(order.payment, initial.payment);
  }
});
