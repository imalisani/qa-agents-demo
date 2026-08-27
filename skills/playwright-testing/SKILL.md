---
name: playwright-testing
description: Select, create, execute, and review Playwright TypeScript tests for browser and HTTP behavior while preserving deterministic evidence and repository conventions.
---

# Playwright Testing

## Before editing

1. Analyze confirmed requirements, unresolved questions, risks, and prioritized scenarios.
2. Inspect `package.json`, Playwright configuration, source, tests, fixtures, helpers, and page objects.
3. Identify existing coverage and avoid duplication.
4. Automate only behavior with an objective expected result.

## Implementation

- Prefer user-visible behavior, accessible locators, and web-first assertions for UI checks.
- Use the Playwright request fixture for API behavior when it is the narrowest reliable layer.
- Avoid arbitrary waits, brittle selectors, shared mutable state, and secret leakage.
- Keep tests independent and reset or isolate data deterministically.
- Assert meaningful outcomes, persisted state, and side effects—not status codes alone.
- Trace tests to scenario and risk IDs in test titles or annotations.

## Execution

Run the narrowest relevant suite first. Preserve configured HTML, JSON, trace, screenshot, and video artifacts. Investigate failures before modifying tests, timeouts, or retries. Report only results from commands actually executed.
