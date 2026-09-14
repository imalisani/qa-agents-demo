---
name: security-testing
description: Design security-focused QA checks for trust boundaries, malformed input, server-owned state, replay, failure behavior, and test-only controls.
---

# Security-focused testing

## Method

1. Map entry points, trusted components, server-owned fields, state changes, and external dependencies.
2. Prioritize financial integrity, replay/idempotency, input parsing, error handling, and test-control exposure.
3. Use bounded negative cases: malformed types, unexpected fields, changed replay payloads, oversized bodies, unsupported media types, and disabled test seams.
4. Verify both the response and absence of unauthorized state mutation.
5. Report missing authentication, authorization, rate limiting, secret management, and infrastructure controls as scope gaps when applicable.

## Decision boundaries

- This methodology is not a penetration test and does not establish exploitability.
- Do not run destructive scanning or attack third-party/shared systems.
- Do not claim coverage for controls the demo does not implement.
- Treat detailed server errors and leaked secrets as evidence risks.

## Evidence

For each check record the trust boundary, input, expected rejection or sanitization, response, persisted state, and remaining exposure.
