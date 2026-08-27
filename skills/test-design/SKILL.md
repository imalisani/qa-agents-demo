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

For every scenario include:

- ID and concise title
- Priority: `Critical`, `High`, `Medium`, or `Low`
- Preconditions and test data
- Steps or action
- Expected observable result
- Coverage type

Trace scenarios to acceptance criteria or identified risks. Consolidate overlapping scenarios and identify existing coverage when repository tests are available. End with exclusions, dependencies, and unresolved questions.
