const SUPPORTED_SCENARIOS = new Set([
  'success',
  'delayed-success',
  'failure',
  'timeout-before-acceptance',
  'timeout-after-acceptance',
  'transient-failure',
]);

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export class SimulatedRefundProvider {
  constructor({ delayMs = 150 } = {}) {
    this.delayMs = delayMs;
    this.reset();
  }

  reset() {
    this.attempts = new Map();
  }

  async process({ idempotencyKey, scenario }) {
    if (!SUPPORTED_SCENARIOS.has(scenario)) {
      return { accepted: false, httpStatus: 400, error: 'Unsupported simulated provider scenario.' };
    }

    const attempts = (this.attempts.get(idempotencyKey) ?? 0) + 1;
    this.attempts.set(idempotencyKey, attempts);

    if (scenario === 'delayed-success') {
      await wait(this.delayMs);
      return { accepted: true, status: 'APPROVED', httpStatus: 201, outcome: 'confirmed' };
    }
    if (scenario === 'failure') {
      return { accepted: false, httpStatus: 502, error: 'Simulated provider rejected the refund.' };
    }
    if (scenario === 'timeout-before-acceptance') {
      return { accepted: false, httpStatus: 504, error: 'Simulated provider timed out before acceptance.' };
    }
    if (scenario === 'timeout-after-acceptance') {
      return { accepted: true, status: 'PENDING', httpStatus: 202, outcome: 'unknown' };
    }
    if (scenario === 'transient-failure' && attempts === 1) {
      return { accepted: false, httpStatus: 503, error: 'Simulated transient provider failure.' };
    }

    return { accepted: true, status: 'APPROVED', httpStatus: 201, outcome: 'confirmed' };
  }
}
