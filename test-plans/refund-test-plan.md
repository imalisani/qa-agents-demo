# Refund workflow — risk-based test plan

| ID | Priority | Type | Scenario | Expected observable result | Risk | Automation |
|---|---|---|---|---|---|---|
| RF-T01 | Critical | Happy path/boundary | Request a full refund equal to the paid total. | One refund is created; cumulative total equals but does not exceed paid amount; allocation is proportional. | R-01, R-02 | Automated |
| RF-T02 | High | Happy path | Request an exactly divisible partial refund. | One partial refund is created and allocated 75% card / 25% credit. | R-02 | Automated |
| RF-T03 | Critical | Boundary | Create multiple partial refunds totaling the amount paid, then request one additional cent. | First requests succeed; additional request is rejected without increasing refunded value. | R-01 | Automated |
| RF-T04 | Critical | Integration/idempotency | Retry the same refund using the same idempotency key. | The original response is returned and only one refund exists. | R-03 | Automated |
| RF-T05 | Critical | Negative | Request more than the amount paid. | Request is rejected and no refund side effect exists. | R-01 | Automated |
| RF-T06 | High | State | Create a refund and inspect its state. | State belongs to the accepted enum. | R-04 | Automated |
| RF-T07 | Critical | Concurrency | Submit simultaneous refunds whose sum exceeds the remaining amount. | At most the remaining amount is accepted. | R-05 | Blocked by Q-03 and absent concurrency contract |
| RF-T08 | High | Boundary | Allocate an amount producing a fractional minor unit. | Allocation follows the approved residual-cent rule. | R-02 | Blocked by Q-02 |
| RF-T09 | High | Business | Refund a line with a cart-level discount. | Amount follows approved discount allocation. | R-07 | Blocked by Q-05 |
| RF-T10 | High | Integration | Provider times out after accepting a refund. | Reconciliation reaches one financial outcome without duplication. | R-06 | Blocked by Q-01/Q-07 and absent provider simulator |
| RF-T11 | High | Multi-seller | One seller rejects while another approves. | Aggregate and seller states follow the approved rule. | R-09 | Blocked by Q-08 |
| RF-T12 | High | Boundary | Request at the exact eligibility deadline. | Eligibility follows the approved timezone and boundary rule. | R-08 | Blocked by Q-04 |

## Regression focus

- Original order and payment records remain immutable.
- Internal-credit balance changes exactly once.
- Provider retry and webhook handling remain idempotent.
- Seller settlement receives only approved refundable amounts.
- Customer-visible totals match financial ledgers.
