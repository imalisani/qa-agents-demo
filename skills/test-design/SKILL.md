---
name: test-design
description: Design risk-based test scenarios and test plans from analyzed requirements, covering happy paths, negative behavior, boundaries, edge cases, integrations, and regressions without implementing automation.
---

# Test Design

Analyze the requirement and unresolved questions before producing scenarios. Do not invent expected results for unspecified behavior; label clarification-dependent scenarios explicitly.

## Coverage

Consider only relevant categories:

- Happy paths and critical user journeys
- Negative validation and authorization behavior
- Boundary values and state transitions
- Unusual but credible edge cases
- Integrations, failures, and recovery
- Security and data integrity
- Accessibility and supported environments
- Regression impact on adjacent functionality

Use equivalence partitioning, boundary-value analysis, decision tables, or state-transition testing when they improve coverage or reduce duplication.

## Scenario format

Write test cases in valid Gherkin. Start each plan with one or more `Feature` blocks and use:

- `Background` only for preconditions shared by every scenario in that feature
- `Scenario` for one concrete behavior
- `Scenario Outline` plus `Examples` for genuine data-driven variations
- `Given` for state and test data, `When` for the action, and `Then` for observable outcomes
- `And` or `But` only when it keeps the behavior readable

For every scenario include tags or adjacent metadata for:

- ID and concise title
- Priority: `Critical`, `High`, `Medium`, or `Low`
- Coverage type
- Acceptance criteria and risk IDs
- Automation status: automated, candidate, manual, or blocked

Keep preconditions, concrete test data, actions, and expected observable results inside the Gherkin steps. Phrase steps in domain language rather than UI implementation details unless the requirement is specifically about the UI. Each `Then` must be falsifiable.

Example:

```gherkin
@RF-T04 @critical @integration @risk-R03 @automated
Scenario: A technical retry does not duplicate a refund
  Given an order with 40.00 USD remaining refundable
  And a refund request identified by idempotency key "stable-refund-key"
  When the same refund request is submitted twice
  Then both responses reference the same refund
  And exactly one refund exists for the order
```

Trace scenarios to acceptance criteria or identified risks. Consolidate overlapping scenarios and identify existing coverage when repository tests are available. End with exclusions, dependencies, and unresolved questions.

For clarification-dependent behavior, tag the scenario `@blocked` and state the unresolved question or dependency next to it. Do not write a definitive `Then` for business behavior that has not been agreed; express only the validation that becomes executable after the named decision is resolved.
