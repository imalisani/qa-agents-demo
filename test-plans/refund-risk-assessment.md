# Refund workflow — risk assessment

| ID | Priority | Category | Failure mode | Impact | Test focus |
|---|---|---|---|---|---|
| R-01 | Critical | Data consistency | One or cumulative refunds exceed the amount paid. | Direct financial loss and ledger inconsistency. | Single and cumulative limit enforcement with no side effects. |
| R-02 | Critical | Financial | Card and internal-credit allocation is incorrect. | Customer funds and accounting records diverge. | Exact-divisible proportional fixtures; rounding remains blocked. |
| R-03 | Critical | Integration/idempotency | A retry creates a duplicated provider refund. | Duplicate customer credit and financial loss. | Same idempotency key returns the original refund once. |
| R-04 | High | State integrity | Invalid or contradictory refund states are stored. | Incorrect customer communication and unsafe retries. | Validate values against the confirmed state set. |
| R-05 | Critical | Concurrency | Simultaneous partial refunds pass stale total checks. | Cumulative over-refund. | PostgreSQL row locking verifies the invariant; winner/response business semantics remain unresolved. |
| R-06 | High | Integration | Provider timeout leaves an unknown result and a retry duplicates it. | Reconciliation failure or duplicate refund. | Deterministic simulator covers local retry/state handling; real webhook/reconciliation remains blocked. |
| R-07 | High | Business | Discounts are allocated incorrectly on partial refunds. | Over/under-refund and seller settlement errors. | Blocked pending allocation rules. |
| R-08 | High | Business | Non-refundable products or expired items are refunded. | Policy breach and seller loss. | Blocked pending eligibility rules. |
| R-09 | High | Multi-seller | One seller outcome corrupts another seller's refund. | Incorrect partial result and settlement. | Blocked pending aggregate behavior. |
| R-10 | Medium | Regression | Refund processing changes order totals or original payment records. | Audit history becomes unreliable. | Verify immutable original payment data when persistence exists. |

## Highest-risk conclusion

The primary release gate is financial invariance under retries and concurrency. The demo now automates simultaneous PostgreSQL writes and deterministic provider retry/unknown-outcome handling. Real provider reconciliation, Product-defined concurrency semantics, and production infrastructure remain explicitly unproven.
