---
name: failure-investigation
description: Investigate failing automated or manual tests to determine whether the cause is a product defect, test defect, environment issue, data issue, flaky behavior, or an unresolved requirement.
---

# Failure Investigation

Preserve evidence and investigate before editing tests or filing a bug.

## Workflow

1. Capture the failing command, test name, environment, error, stack trace, artifacts, and relevant timestamps.
2. Compare the assertion with the requirement and current implementation. Confirm that the expected result is valid.
3. Reproduce with the smallest relevant scope. Repeat only enough to distinguish deterministic failure from intermittency.
4. Inspect Playwright traces, screenshots, videos, console output, network activity, application logs, and test data where available.
5. Check selectors, waits, assertions, fixtures, shared state, cleanup, credentials, configuration, dependencies, and recent changes.
6. Use focused experiments that change one variable at a time. Do not mask the symptom by increasing timeouts, retries, or weakening assertions without evidence.
7. Classify the result as one of:
   - Confirmed product defect
   - Test implementation defect
   - Test data or state issue
   - Environment or dependency issue
   - Flaky or timing-sensitive behavior
   - Requirement ambiguity
   - Inconclusive
8. State the evidence supporting the classification and the next action.

## Output

Report the failure summary, investigation performed, observations, classification, confidence, evidence, and recommended action. Create a bug report only when product behavior is sufficiently confirmed.
