import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { ALLOWED_STATUSES } from './refund-store.mjs';

const { Pool } = pg;
const ORDER_ID = 'order-refund-demo';

function toRefund(row) {
  return {
    id: `refund-${row.id}`,
    orderId: row.order_id,
    amount: row.amount,
    allocation: { card: row.card_amount, credit: row.credit_amount },
    status: row.status,
    idempotencyKey: row.idempotency_key,
  };
}

export class PostgresRefundStore {
  constructor({ connectionString }) {
    this.pool = new Pool({ connectionString });
  }

  async initialize() {
    const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
    await this.pool.query(schema);
  }

  async reset() {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('TRUNCATE refunds RESTART IDENTITY');
      await client.query(
        `INSERT INTO orders (id, paid, card_paid, credit_paid)
         VALUES ($1, 12000, 9000, 3000)
         ON CONFLICT (id) DO UPDATE
         SET paid = EXCLUDED.paid, card_paid = EXCLUDED.card_paid, credit_paid = EXCLUDED.credit_paid`,
        [ORDER_ID],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrder() {
    const result = await this.pool.query(
      `SELECT o.id, o.paid, o.card_paid, o.credit_paid,
              COALESCE(SUM(r.amount) FILTER (WHERE r.status <> 'REJECTED'), 0)::integer AS refunded
       FROM orders o
       LEFT JOIN refunds r ON r.order_id = o.id
       WHERE o.id = $1
       GROUP BY o.id`,
      [ORDER_ID],
    );
    const row = result.rows[0];
    return {
      id: row.id,
      paid: row.paid,
      payment: { card: row.card_paid, credit: row.credit_paid },
      refunded: row.refunded,
      refundableRemaining: row.paid - row.refunded,
    };
  }

  async findByIdempotencyKey(idempotencyKey) {
    const result = await this.pool.query('SELECT * FROM refunds WHERE idempotency_key = $1', [idempotencyKey]);
    return result.rowCount ? toRefund(result.rows[0]) : undefined;
  }

  async createRefund({ amount, idempotencyKey, status = 'PENDING' }) {
    if (!Number.isInteger(amount) || amount <= 0) {
      return { error: 'Refund amount must be a positive integer in cents.', status: 400 };
    }
    if (!ALLOWED_STATUSES.has(status)) throw new Error('Invalid refund state');

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [ORDER_ID]);
      const existingResult = await client.query('SELECT * FROM refunds WHERE idempotency_key = $1', [idempotencyKey]);
      if (existingResult.rowCount) {
        await client.query('COMMIT');
        return { created: false, refund: toRefund(existingResult.rows[0]) };
      }

      const order = orderResult.rows[0];
      const totalResult = await client.query(
        "SELECT COALESCE(SUM(amount) FILTER (WHERE status <> 'REJECTED'), 0)::integer AS refunded FROM refunds WHERE order_id = $1",
        [ORDER_ID],
      );
      const refundableRemaining = order.paid - totalResult.rows[0].refunded;
      if (amount > refundableRemaining) {
        await client.query('ROLLBACK');
        return { error: 'Refund total cannot exceed the amount actually paid.', status: 409 };
      }

      const card = Math.round((amount * order.card_paid) / order.paid);
      const inserted = await client.query(
        `INSERT INTO refunds (order_id, amount, card_amount, credit_amount, status, idempotency_key)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [ORDER_ID, amount, card, amount - card, status, idempotencyKey],
      );
      await client.query('COMMIT');
      return { created: true, refund: toRefund(inserted.rows[0]) };
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        const existing = await this.findByIdempotencyKey(idempotencyKey);
        return { created: false, refund: existing };
      }
      throw error;
    } finally {
      client.release();
    }
  }

  async listRefunds() {
    const result = await this.pool.query('SELECT * FROM refunds ORDER BY id');
    return result.rows.map(toRefund);
  }

  async close() {
    await this.pool.end();
  }
}
