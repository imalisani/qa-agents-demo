# Refund workflow — risk assessment

| ID | Priority | Category | Failure mode | Impact | Test focus |
|---|---|---|---|---|---|
| R-01 | Critical | Data consistency | One or cumulative refunds exceed the amount paid. | Direct financial loss and ledger inconsistency. | Single and cumulative limit enforcement with no side effects. |
| R-02 | Critical | Financial | Card and internal-credit allocation is incorrect. | Customer funds and accounting records diverge. | Exact-divisible proportional fixtures; rounding remains blocked. |
| R-03 | Critical | Integration/idempotency | A retry creates a duplicated provider refund. | Duplicate customer credit and financial loss. | Same idempotency key returns the original refund once. |
| R-04 | High | State integrity | Invalid or contradictory refund states are stored. | Incorrect customer communication and unsafe retries. | Validate values against the confirmed state set. |
| R-05 | Critical | Concurrency | Simultaneous partial refunds pass stale total checks. | Cumulative over-refund. | Requires an atomicity contract and concurrency-capable interface. |
| R-06 | High | Integration | Provider timeout leaves an unknown result and a retry duplicates it. | Reconciliation failure or duplicate refund. | Blocked pending webhook/reconciliation and idempotency rules. |
| R-07 | High | Business | Discounts are allocated incorrectly on partial refunds. | Over/under-refund and seller settlement errors. | Blocked pending allocation rules. |
| R-08 | High | Business | Non-refundable products or expired items are refunded. | Policy breach and seller loss. | Blocked pending eligibility rules. |
| R-09 | High | Multi-seller | One seller outcome corrupts another seller's refund. | Incorrect partial result and settlement. | Blocked pending aggregate behavior. |
| R-10 | Medium | Regression | Refund processing changes order totals or original payment records. | Audit history becomes unreliable. | Verify immutable original payment data when persistence exists. |

## Highest-risk conclusion

The primary release gate is financial invariance under retries and concurrency. The demo automates the invariant and sequential retry behavior; true simultaneous concurrency and provider reconciliation remain explicitly unproven.
