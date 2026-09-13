# Refund workflow — automation strategy

## Decision

Automate only confirmed financial invariants and deterministic retry behavior. Use the browser for customer-visible full and partial flows, and Playwright's HTTP client for narrow idempotency and guard checks.

## Automated now

- `RF-T01`: full refund at the paid-total boundary.
- `RF-T02`: partial refund with an exact-divisible allocation.
- `RF-T03`: cumulative partial-refund ceiling.
- `RF-T04`: duplicate prevention using one stable idempotency key.
- `RF-T05`: over-refund rejection without side effects.
- `RF-T06`: state belongs to the explicitly accepted set.

The additional implemented coverage is traced in [ci-regression.feature](ci-regression.feature): RF-T13–RF-T25 cover API validation/contracts, UI regressions and accessibility; RF-U01–RF-U04 cover domain invariants; CI-T01 verifies the deployed report. Original scenarios now also check exact refund counts and unchanged original payment data.

Input validation follows the demo contract: positive USD values with at most two decimal places in the UI, positive integer cents in the API. Allocation conservation across all permitted single-refund amounts does not prove a residual-cent policy or cumulative per-payment-method accounting.

## Deliberately not automated

- Eligibility windows, because their calculation and boundary semantics are unresolved.
- Shipping refunds and discount allocation, because formulas are unresolved.
- Cross-seller outcomes, because aggregate behavior is unresolved.
- Fractional-cent allocation, because rounding is unresolved.
- Provider timeout/reconciliation, because the state-transition and idempotency contracts are unresolved.
- True concurrent requests, because the required atomicity contract and production-like persistence are absent.

## Demo boundary

`app/` is a deterministic local test surface, not a claimed production implementation. Its fixed fixture uses USD 120.00 paid as USD 90.00 card plus USD 30.00 internal credit so proportional examples do not require an invented rounding rule.
