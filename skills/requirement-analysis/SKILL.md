---
name: requirement-analysis
description: Analyze user stories, acceptance criteria, and feature requirements before test design or implementation; identify expected behavior, gaps, ambiguities, and questions without inventing requirements.
---

# Requirement Analysis

Apply a Shift-Left review before designing or executing tests.

## Workflow

1. Extract actors, preconditions, triggers, expected outcomes, business rules, and dependencies explicitly stated in the requirement.
2. Rewrite the expected behavior as observable, testable outcomes while preserving the original intent.
3. Identify contradictions, ambiguities, missing rules, and acceptance criteria that cannot be objectively verified.
4. Separate confirmed requirements from assumptions. Never silently turn an assumption into expected behavior.
5. Ask focused questions for Product or Development, ordered by their impact on implementation and testing.
6. Note business and technical risks that arise directly from the requirement gaps.
7. State whether the requirement is ready for test design and list any blocking clarifications.

## Output

Include:

- Expected behavior
- Preconditions and dependencies
- Ambiguous or missing requirements
- Questions for Product/Development
- Business risks
- Technical risks
- Testability assessment

Use `Critical`, `High`, `Medium`, or `Low` when prioritizing questions or risks. Do not generate detailed test cases unless requested.
