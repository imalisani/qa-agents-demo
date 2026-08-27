# Refund workflow — requirement analysis

## User Story

As a customer, I want to request a full or partial refund for a purchase so that I can recover the corresponding amount for products I no longer want to keep.

## Confirmed business rules

- An order can contain products from different sellers.
- Refund eligibility can differ by product and by refund period.
- Product-level and cart-level discounts can affect the original paid amount.
- Original shipping can be refundable or non-refundable.
- Payment can combine card and internal credit.
- Refunds must be allocated proportionally to the original payment methods.
- Provider processing can be asynchronous.
- Allowed refund states are `PENDING`, `APPROVED`, `REJECTED`, and `PARTIALLY_REFUNDED`.
- Multiple partial refunds can exist for one purchase.
- Cumulative refunds must never exceed the amount actually paid.
- Retrying a request must not create a duplicate refund.

## Ambiguities and missing requirements

| ID | Priority | Gap | Why it matters |
|---|---|---|---|
| Q-01 | Critical | The idempotency identity and retention period are not defined. | Duplicate prevention cannot be specified across clients, sessions, or time. |
| Q-02 | Critical | Rounding rules for proportional card/credit allocation are missing. | Fractional minor units can produce financial discrepancies. |
| Q-03 | Critical | Concurrency behavior for two simultaneous partial refunds is not defined beyond the total invariant. | Both requests may pass a stale balance check. |
| Q-04 | High | Eligibility rules and the start/end of each refund period are undefined. | Product eligibility cannot be automated objectively. |
| Q-05 | High | Cart-level discount allocation across products and sellers is undefined. | Partial refund amounts can differ materially. |
| Q-06 | High | Shipping refund conditions and allocation are undefined. | Full and partial totals are ambiguous. |
| Q-07 | High | State transitions, transition ownership, and terminal states are undefined. | Async provider behavior and retries cannot be fully verified. |
| Q-08 | High | Behavior when one seller accepts and another rejects is undefined. | Cross-seller partial outcomes cannot be asserted. |
| Q-09 | Medium | Refund cancellation, expiry, and manual review behavior are absent. | Recovery and support flows remain uncovered. |

## Questions for Product/Development

1. What creates an idempotency key, what request fields does it cover, and how long is it retained?
2. Which rounding algorithm and residual-cent policy applies to proportional payment allocation?
3. Must concurrent refund requests be serialized per order, and which response should the losing request receive?
4. How is each product's eligibility window calculated, including timezone and boundary instants?
5. How are cart discounts allocated across products, quantities, sellers, tax, and shipping?
6. Under which conditions is original shipping refundable, and can it be partially refunded?
7. Which state transitions are valid, and what event moves a request between them?
8. Can seller-level outcomes differ within one request, and how is the aggregate state calculated?

## Affected functionality

- Order and line-item history
- Seller settlement and commission accounting
- Discount allocation
- Shipping and tax calculation
- Card payment provider integration
- Internal-credit ledger
- Refund state machine and webhooks
- Idempotency and concurrency controls
- Customer notifications and support tooling

## Testability decision

The full workflow is **not ready for complete automation**. The paid-total ceiling, existence of proportional allocation using exact-divisible fixtures, multiple partial refunds, allowed state set, and retry non-duplication are sufficiently explicit for bounded automation. Eligibility periods, shipping, discounts, cross-seller outcomes, rounding remainders, and detailed async transitions remain blocked.
