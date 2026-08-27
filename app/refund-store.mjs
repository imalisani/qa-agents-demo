const ORDER = Object.freeze({
  id: 'order-refund-demo',
  paid: 12000,
  payment: Object.freeze({ card: 9000, credit: 3000 }),
});

const ALLOWED_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'PARTIALLY_REFUNDED']);

export class RefundStore {
  constructor() {
    this.reset();
  }

  reset() {
    this.refunds = [];
    this.idempotency = new Map();
  }

  getOrder() {
    const refunded = this.refunds.reduce((sum, refund) => sum + refund.amount, 0);
    return { ...ORDER, refunded, refundableRemaining: ORDER.paid - refunded };
  }

  createRefund({ amount, idempotencyKey }) {
    if (this.idempotency.has(idempotencyKey)) {
      return { created: false, refund: this.idempotency.get(idempotencyKey) };
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      return { error: 'Refund amount must be a positive integer in cents.', status: 400 };
    }

    const order = this.getOrder();
    if (amount > order.refundableRemaining) {
      return { error: 'Refund total cannot exceed the amount actually paid.', status: 409 };
    }

    const card = Math.round((amount * ORDER.payment.card) / ORDER.paid);
    const refund = {
      id: `refund-${this.refunds.length + 1}`,
      orderId: ORDER.id,
      amount,
      allocation: { card, credit: amount - card },
      status: 'PENDING',
      idempotencyKey,
    };

    if (!ALLOWED_STATUSES.has(refund.status)) {
      throw new Error('Invalid refund state');
    }

    this.refunds.push(refund);
    this.idempotency.set(idempotencyKey, refund);
    return { created: true, refund };
  }

  listRefunds() {
    return [...this.refunds];
  }
}
