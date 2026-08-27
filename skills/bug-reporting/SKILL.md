---
name: bug-reporting
description: Produce evidence-based, reproducible defect reports after a failure has been investigated and confirmed as product behavior rather than a test, data, or environment issue.
---

# Bug Reporting

Do not classify an automated-test failure as a product defect until failure investigation rules out likely test, data, configuration, and environment causes.

## Report format

Include:

- **Title:** affected behavior, condition, and outcome
- **Severity:** impact-based classification with rationale
- **Environment:** build, browser/device, API version, configuration, and relevant account state
- **Preconditions:** required state and safe test data description
- **Steps to reproduce:** minimal, deterministic, numbered actions
- **Expected result:** requirement-backed outcome
- **Actual result:** directly observed behavior
- **Reproducibility:** frequency and attempted repetitions
- **Evidence:** screenshots, video, trace, logs, response details, or links, with secrets redacted
- **Impact:** affected users, workflow, data, or business consequence
- **Notes:** suspected scope, regression information, and related cases when supported by evidence

Distinguish severity from priority. Avoid speculative root causes, vague language, duplicate reports, and sensitive data. If expected behavior is ambiguous, report the requirement gap instead of asserting a defect.
