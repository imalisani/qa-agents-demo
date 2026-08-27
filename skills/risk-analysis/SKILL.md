---
name: risk-analysis
description: Assess business, product, security, integration, and regression risks for a requirement or implementation change and convert them into risk-based testing priorities.
---

# Risk Analysis

Base the assessment on provided requirements, relevant source changes, system context, and existing coverage. Mark unknowns instead of guessing.

## Workflow

1. Identify the critical user flows, protected assets, external dependencies, and affected components.
2. Describe credible failure modes and their consequences for users and the business.
3. Evaluate each risk by impact and likelihood using `Critical`, `High`, `Medium`, or `Low` priority.
4. Distinguish business risks from technical risks, including security, data integrity, availability, integration, and regression concerns.
5. Map each material risk to a proposed mitigation or test focus.
6. Highlight risks that cannot be evaluated because information or observability is missing.

## Output

For each risk provide:

- Risk and category
- Trigger or failure mode
- User/business impact
- Likelihood and rationale
- Priority
- Recommended test or mitigation

Prioritize business impact and critical flows over the number of possible scenarios. Do not claim a vulnerability or defect without evidence.
