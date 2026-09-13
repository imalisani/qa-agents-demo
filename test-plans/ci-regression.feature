Feature: Refund correctness and report publication

  Rule: Reject invalid refund requests without changing financial state
    Background:
      Given the demo order was paid with 90.00 USD by card and 30.00 USD by credit
      And no refunds exist

    @RF-T13 @High @negative @risk-R01 @automated
    Scenario Outline: Invalid API amounts have no side effects
      When a refund request contains <amount>
      Then the API returns 400 with the integer-cent validation message
      And the original order and refund history are unchanged
      Examples:
        | amount          |
        | a missing value |
        | zero            |
        | a negative      |
        | fractional cents|
        | a string        |
        | null            |
        | a boolean       |
        | an object       |
        | an array        |

    @RF-T14 @High @negative @risk-R03 @automated
    Scenario Outline: A request requires an idempotency key
      When a refund request has an <key> idempotency header
      Then the API returns 400 with the missing-key message
      And the original order and refund history are unchanged
      Examples:
        | key     |
        | absent  |
        | empty   |

    @RF-T15 @High @negative @risk-R01 @automated
    Scenario: Malformed JSON does not create a refund
      When a refund request contains malformed JSON
      Then the API returns 400 with a JSON validation message
      And the original order and refund history are unchanged

    @RF-T16 @High @contract @risk-R01 @risk-R04 @automated
    Scenario: The API creates a refund at the paid-total boundary
      When a refund of 12000 integer cents is submitted with a new key
      Then the API returns 201 with an identified PENDING refund for the original order
      And its allocation is 9000 card cents and 3000 credit cents
      And exactly that refund is stored with no remaining refundable amount

    @RF-T17 @Low @contract @automated
    Scenario: Unknown API routes return a JSON error
      When a nonexistent API route is requested
      Then the API returns 404 with the error "Not found"

  Rule: Customer-visible refund totals remain consistent
    Background:
      Given the demo has no refunds and 120.00 USD remaining

    @RF-T18 @Medium @smoke @automated
    Scenario: The initial summary agrees with the empty history
      When the refund page is opened
      Then paid is 120.00 USD, refunded is 0.00 USD and remaining is 120.00 USD
      And the history says no refunds have been requested

    @RF-T19 @Critical @journey @risk-R01 @automated
    Scenario: A full refund after a partial refund uses only the remaining amount
      When the customer requests 40.00 USD and then requests a full refund
      Then the history contains refunds of 40.00 USD and 80.00 USD
      And refunded is 120.00 USD and remaining is 0.00 USD

    @RF-T20 @High @negative @risk-R01 @automated
    Scenario: The interface displays an over-refund rejection
      When the customer requests 120.01 USD
      Then the paid-total error is visible
      And the original order and refund history are unchanged

    @RF-T21 @High @regression @risk-R01 @automated
    Scenario Outline: Invalid currency input is never silently converted into a refund
      When the customer submits <input>
      Then no refund request is sent
      And the input is invalid and financial state remains unchanged
      Examples:
        | input  |
        | empty  |
        | 0      |
        | -1     |
        | abc    |
        | 40abc  |
        | 40.001 |

    @RF-T22 @Medium @regression @automated
    Scenario: Reloading preserves the current server session
      When the customer requests 40.00 USD and reloads the page
      Then exactly one 40.00 USD refund is visible and 80.00 USD remains

    @RF-T25 @High @regression @risk-R01 @automated
    Scenario: Correcting invalid input clears validation and preserves exact cents
      When the customer submits zero and then corrects the amount to 40.04 USD
      Then one refund of 40.04 USD is created
      And 30.03 USD is allocated to card and 10.01 USD to credit

  Rule: Accessible refund interactions
    @RF-T23 @High @a11y @automated
    Scenario: The initial and submitted states pass the automated accessibility threshold
      Given the refund page is open
      When axe checks the initial page and the page after a 40.00 USD refund
      Then no serious or critical WCAG A or AA violation is reported

    @RF-T24 @High @a11y @automated
    Scenario: A customer submits a refund with the keyboard
      Given the initial refund page is open
      When the customer tabs through the amount and refund buttons
      And enters 40.00 USD and submits using the keyboard
      Then the status region shows the accepted amount with polite live semantics
      And the summary shows 80.00 USD remaining

  Rule: Domain-level financial invariants
    @RF-U01 @High @unit @automated
    Scenario: Reset restores the fixture and clears idempotency
      Given the store contains a refund with a stable key
      When it is reset and the key is reused
      Then a new refund is created against a clean order

    @RF-U02 @Critical @unit @risk-R01 @risk-R03 @automated
    Scenario: Sequential refunds and retries preserve original payment data
      When 40.00 USD is refunded, retried with the same key, and 80.00 USD is refunded
      Then two refunds total 120.00 USD and a further refund is rejected
      And the original paid amount and payment split are unchanged

    @RF-U03 @High @unit @negative @risk-R01 @automated
    Scenario: Invalid amounts are rejected directly by the domain
      When invalid amounts and an over-limit amount are passed to a fresh store
      Then no refund or financial mutation occurs

    @RF-U04 @Critical @unit @risk-R02 @automated
    Scenario: Every permitted single-refund amount conserves money
      When every amount from 1 to 12000 cents is refunded in a separate fresh store
      Then card and credit allocations are nonnegative integer cents
      And their sum equals the requested amount
      And refunded plus remaining equals the original paid amount

  Rule: Publish only current verified results
    @CI-T01 @High @deployment @automated
    Scenario: The published dashboard belongs to the successful commit
      Given all quality checks passed for a main branch commit
      When its fresh Allure report is published
      Then the public dashboard loads and contains suites with test results
      And its provenance contains the exact commit and workflow run ID

  # Demo contract: the form accepts positive USD values with at most two decimal places.
  # Allocation conservation does not establish a residual-cent distribution rule.
  # No authentication, provider, concurrency or durable storage claim is made.
  # RF-T07 through RF-T12 remain blocked by the existing requirement questions.
  # Automated live-region checks do not replace manual screen-reader verification.
