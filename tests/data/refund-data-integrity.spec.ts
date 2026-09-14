import pg from 'pg';
import { test, expect, expectOrderState } from '../fixtures/refund.js';

const { Pool } = pg;
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required for data-integrity tests.');
const pool = new Pool({ connectionString });

test.afterAll(async () => {
  await pool.end();
});

test('[Data][RF-T38][Critical][R-01][R-02] API result reconciles with PostgreSQL financial rows', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'sql-reconciliation' }, data: { amount: 4000 },
  });
  expect(response.status()).toBe(201);
  const persisted = await pool.query(
    'SELECT amount, card_amount, credit_amount, status, idempotency_key FROM refunds WHERE idempotency_key = $1',
    ['sql-reconciliation'],
  );
  expect(persisted.rows).toEqual([{
    amount: 4000, card_amount: 3000, credit_amount: 1000,
    status: 'PENDING', idempotency_key: 'sql-reconciliation',
  }]);
  await expectOrderState(request, 4000, 1);
});

test('[Data][RF-T39][Critical][R-03] retry idempotency is enforced by a unique persisted key', async ({ request }) => {
  const options = { headers: { 'Idempotency-Key': 'sql-idempotency' }, data: { amount: 2500 } };
  expect((await request.post('/api/refunds', options)).status()).toBe(201);
  expect((await request.post('/api/refunds', options)).status()).toBe(200);
  const count = await pool.query('SELECT COUNT(*)::integer AS count FROM refunds WHERE idempotency_key = $1', ['sql-idempotency']);
  expect(count.rows[0].count).toBe(1);
  await expectOrderState(request, 2500, 1);
});

test('[Data][RF-T40][Critical][R-01] rejected over-refund produces no partial write', async ({ request }) => {
  const response = await request.post('/api/refunds', {
    headers: { 'Idempotency-Key': 'sql-over-refund' }, data: { amount: 12001 },
  });
  expect(response.status()).toBe(409);
  const count = await pool.query('SELECT COUNT(*)::integer AS count FROM refunds');
  expect(count.rows[0].count).toBe(0);
  const order = await pool.query('SELECT paid, card_paid, credit_paid FROM orders WHERE id = $1', ['order-refund-demo']);
  expect(order.rows).toEqual([{ paid: 12000, card_paid: 9000, credit_paid: 3000 }]);
});

test('[Data][RF-T41][Critical][R-05] concurrent writes preserve the paid-total invariant', async ({ request }) => {
  const [first, second] = await Promise.all([
    request.post('/api/refunds', { headers: { 'Idempotency-Key': 'concurrent-a' }, data: { amount: 7000 } }),
    request.post('/api/refunds', { headers: { 'Idempotency-Key': 'concurrent-b' }, data: { amount: 7000 } }),
  ]);
  expect([first.status(), second.status()].sort()).toEqual([201, 409]);
  const total = await pool.query("SELECT COALESCE(SUM(amount), 0)::integer AS total FROM refunds WHERE status <> 'REJECTED'");
  expect(total.rows[0].total).toBe(7000);
  await expectOrderState(request, 7000, 1);
});

test('[Data][RF-T42][High] SQL constraints reject an invalid financial allocation', async () => {
  await expect(pool.query(
    `INSERT INTO refunds (order_id, amount, card_amount, credit_amount, status, idempotency_key)
     VALUES ('order-refund-demo', 1000, 900, 200, 'PENDING', 'invalid-allocation')`,
  )).rejects.toMatchObject({ code: '23514' });
  const count = await pool.query('SELECT COUNT(*)::integer AS count FROM refunds');
  expect(count.rows[0].count).toBe(0);
});
