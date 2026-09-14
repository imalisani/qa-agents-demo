# Refund workflow — risk-based test plan

## Traceability summary

| ID | Priority | Type | Risk | Automation |
|---|---|---|---|---|
| RF-T01 | Critical | Happy path / boundary | R-01, R-02 | Automated |
| RF-T02 | High | Happy path | R-02 | Automated |
| RF-T03 | Critical | Boundary | R-01 | Automated |
| RF-T04 | Critical | Integration / idempotency | R-03 | Automated |
| RF-T05 | Critical | Negative | R-01 | Automated |
| RF-T06 | High | State validation | R-04 | Automated |
| RF-T07 | Critical | Concurrency | R-05 | Blocked by Q-03 and missing concurrency contract |
| RF-T08 | High | Boundary | R-02 | Blocked by Q-02 |
| RF-T09 | High | Business rule | R-07 | Blocked by Q-05 |
| RF-T10 | High | Integration / recovery | R-06 | Blocked by Q-01, Q-07 and missing provider simulator |
| RF-T11 | High | Multi-seller integration | R-09 | Blocked by Q-08 |
| RF-T12 | High | Eligibility boundary | R-08 | Blocked by Q-04 |
| RF-T26–RF-T30 | Critical/High/Medium | Simulated integration / resilience | R-03, R-06 | Automated against deterministic simulator |
| RF-T31–RF-T37 | Critical/High/Medium | Security-focused QA | R-01, R-03, R-04 | Automated |
| RF-T38–RF-T42 | Critical/High | PostgreSQL / data integrity | R-01, R-02, R-03, R-05, R-10 | Automated |
| PERF-T01 | High | Performance smoke | Regression guardrail | Automated in CI; not a product SLO |

## Executable scenarios

```gherkin
Feature: Refund amounts remain within the amount paid
  As a customer
  I want refunds to preserve the original financial boundaries
  So that no refund creates or loses money

  Background:
    Given an order paid for 120.00 USD
    And 90.00 USD was paid by card
    And 30.00 USD was paid with internal credit
    And no refund exists for the order

  @RF-T01 @critical @happy-path @boundary @risk-R01 @risk-R02 @automated
  Scenario: A full refund equals but never exceeds the paid total
    When the customer requests a full refund of 120.00 USD
    Then exactly one refund is created for 120.00 USD
    And the cumulative refunded amount is 120.00 USD
    And the remaining refundable amount is 0.00 USD
    And 90.00 USD is allocated to card
    And 30.00 USD is allocated to internal credit

  @RF-T02 @high @happy-path @risk-R02 @automated
  Scenario: An exactly divisible partial refund is allocated proportionally
    When the customer requests a partial refund of 40.00 USD
    Then exactly one refund is created for 40.00 USD
    And 30.00 USD is allocated to card
    And 10.00 USD is allocated to internal credit
    And the remaining refundable amount is 80.00 USD

  @RF-T03 @critical @boundary @risk-R01 @automated
  Scenario: Cumulative partial refunds cannot exceed the paid total
    Given accepted partial refunds total 120.00 USD
    When the customer requests an additional refund of 0.01 USD
    Then the request is rejected
    And the cumulative refunded amount remains 120.00 USD
    And no additional refund is created

  @RF-T05 @critical @negative @risk-R01 @automated
  Scenario: A single refund above the paid amount has no side effect
    When the customer requests a refund of 120.01 USD
    Then the request is rejected
    And the cumulative refunded amount remains 0.00 USD
    And the remaining refundable amount remains 120.00 USD
    And no refund is created

Feature: Refund processing is idempotent and state-safe

  @RF-T04 @critical @integration @idempotency @risk-R03 @automated
  Scenario: A technical retry does not duplicate a refund
    Given a refund request for 40.00 USD uses idempotency key "stable-refund-key"
    When the same request is submitted twice
    Then both responses reference the same refund
    And exactly one refund exists for the order
    And the financial effect is applied exactly once

  @RF-T06 @high @state @risk-R04 @automated
  Scenario: A created refund uses an accepted state
    When a refund of 10.00 USD is created
    Then its state is one of PENDING, APPROVED, REJECTED, or PARTIALLY_REFUNDED

  # Blocked by Q-03: the concurrency contract is not defined.
  @RF-T07 @critical @concurrency @risk-R05 @blocked
  Scenario: Simultaneous refunds compete for the remaining refundable amount
    Given multiple refund requests together exceed the remaining refundable amount
    When the requests are submitted simultaneously
    Then the accepted total follows the concurrency rule approved in Q-03
    And the cumulative refunded amount never exceeds the amount paid

Feature: Refund allocation and eligibility rules

  # Blocked by Q-02: the residual-cent allocation rule is not defined.
  @RF-T08 @high @boundary @risk-R02 @blocked
  Scenario: A refund produces a fractional minor-unit allocation
    Given a refund amount cannot be divided exactly between payment methods
    When the refund is allocated
    Then the allocation follows the residual-cent rule approved in Q-02
    And allocated minor units sum exactly to the refund amount

  # Blocked by Q-05: cart-level discount allocation is not defined.
  @RF-T09 @high @business-rule @risk-R07 @blocked
  Scenario: A discounted order line is refunded
    Given an order line received a cart-level discount
    When the customer requests a refund for that line
    Then the refundable amount follows the discount-allocation rule approved in Q-05

  # Blocked by Q-04: timezone and inclusivity of the deadline are not defined.
  @RF-T12 @high @boundary @risk-R08 @blocked
  Scenario: A refund is requested at the exact eligibility deadline
    Given the request timestamp equals the configured eligibility deadline
    When the customer submits the refund
    Then eligibility follows the timezone and boundary rule approved in Q-04

Feature: Refund provider and seller outcomes converge safely

  # Blocked by Q-01/Q-07 and the absence of a provider simulator.
  @RF-T10 @high @integration @recovery @risk-R06 @blocked
  Scenario: The provider times out after accepting a refund
    Given the provider accepted the refund but its response was not received
    When the reconciliation process runs
    Then the refund reaches the single financial outcome approved in Q-01 and Q-07
    And no duplicate provider refund is created

  # Blocked by Q-08: aggregate behavior for mixed seller outcomes is not defined.
  @RF-T11 @high @integration @multi-seller @risk-R09 @blocked
  Scenario: Sellers return different refund outcomes
    Given one seller approves its portion of a refund
    And another seller rejects its portion
    When the aggregate refund state is calculated
    Then seller and aggregate states follow the rule approved in Q-08
```

## Implemented full-lifecycle extensions

```gherkin
Feature: Deterministic provider behavior preserves local financial state

  @RF-T26 @RF-T27 @RF-T28 @RF-T29 @RF-T30 @integration @automated @simulated-provider
  Scenario: A controlled provider outcome is handled without duplicate local effects
    Given the simulated provider is explicitly enabled
    When success, delay, rejection, pre-acceptance timeout, unknown outcome, or transient failure is selected
    Then the API response matches the deterministic scenario
    And only accepted outcomes create a refund
    And a retry with the same idempotency key creates at most one refund

Feature: Security-focused refund validation protects trust boundaries

  @RF-T31 @RF-T32 @RF-T33 @RF-T34 @RF-T35 @RF-T36 @RF-T37 @security @automated
  Scenario: Untrusted input cannot own protected refund state
    When a client sends server-owned fields, changed replay data, malformed transport data, or disabled simulator controls
    Then the request is rejected or sanitized according to the implemented contract
    And no unauthorized financial state is persisted

Feature: PostgreSQL persistence enforces financial integrity

  @RF-T38 @RF-T39 @RF-T40 @RF-T41 @RF-T42 @data @automated
  Scenario: API state reconciles with transactional database state
    Given the demo runs in PostgreSQL persistence mode
    When refunds succeed, fail, retry, or arrive concurrently
    Then API totals reconcile with persisted rows
    And original payment data remains unchanged
    And SQL constraints prevent invalid allocation and duplicate idempotency state

Feature: CI detects material performance regression

  @PERF-T01 @performance @automated
  Scenario: The read-only refund workload stays within demo CI guardrails
    Given one virtual user executes five iterations against the local CI service
    When health, order, and refund-history endpoints are requested
    Then the HTTP failure rate is below 1 percent
    And p95 request duration is below 500 milliseconds
    And more than 99 percent of checks pass
```

The performance values are regression guardrails for this controlled runner, not Product-approved SLOs. RF-T29 proves replay safety for a stored unknown outcome; it does not prove real provider reconciliation or a final financial outcome. RF-T41 proves the paid-total invariant under database concurrency; Product still needs to define winner selection and response semantics for concurrent requests.

## Regression focus

- Original order and payment records remain immutable.
- Internal-credit balance changes exactly once.
- Provider retry and webhook handling remain idempotent.
- Seller settlement receives only approved refundable amounts.
- Customer-visible totals match financial ledgers.

## Dependencies and unresolved questions

- Q-01 and Q-07: provider timeout, reconciliation, and final financial outcome.
- Q-02: residual-cent allocation.
- Q-03: concurrent refund serialization and acceptance contract.
- Q-04: eligibility timezone and exact boundary semantics.
- Q-05: cart-level discount allocation.
- Q-08: aggregate state for mixed seller outcomes.
- A real provider contract, webhook/reconciliation path, and production-like failure semantics are still required before RF-T10 is fully executable.
