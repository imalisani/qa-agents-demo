# Quality execution summary

## Verified local full-lifecycle run

- Date: 2026-09-14.
- Environment: Windows, Node 24.13.0, Chromium, PostgreSQL 17 Alpine in Docker, Grafana k6 container.
- Dependency install: `npm ci` completed with 0 known npm audit vulnerabilities.
- Static checks: ESLint and TypeScript passed.
- Unit: **8 passed**, **100% line/branch/function coverage** for the in-memory store and simulated-provider logic; branch gate is 90%.
- Functional Playwright: **33 passed** — 18 API, 13 UI, 2 accessibility.
- Simulated integration/resilience: **6 passed**.
- Security-focused API: **7 passed**.
- PostgreSQL/data integrity: **5 passed**.
- Combined automated test cases: **59 passed, 0 failed**.
- Combined Allure: **51 Playwright results**, all passed. Unit and k6 results are represented in the QA Evidence Pack rather than Allure test cases.
- Machine-readable aggregation: passed with every required local evidence source present.

## Observed k6 smoke result

This measurement belongs to the local demo runner and is not a Product SLO or production capacity claim.

| Metric | Observed |
|---|---:|
| Profile | smoke — 1 virtual user, 5 iterations |
| HTTP requests | 15 |
| Checks | 25 passed, 0 failed (100%) |
| HTTP failure rate | 0% |
| p95 HTTP duration | 2.12 ms |
| Throughput | 430.06 requests/second |

The demo/CI guardrails passed: p95 below 500 ms, HTTP failures below 1%, and checks above 99%.

## Data and integration evidence

- API refund rows reconciled directly with PostgreSQL amount, allocation, status, and idempotency data.
- Unique persisted idempotency, over-refund rollback, original-payment immutability, concurrent paid-total protection, and an allocation check constraint passed.
- The opt-in **SIMULATED PROVIDER** passed confirmed success, delayed success, rejection, timeout-before-acceptance, unknown accepted outcome/replay, and transient failure/retry scenarios.

## Security-focused evidence

Server-owned identifiers, order, allocation, status, and idempotency source were protected from body injection. Changed-payload replay, unsupported content type, oversized body, long idempotency key, disabled simulator controls, and prototype-shaped input behaved according to the implemented contract without unauthorized financial mutation.

Authentication, authorization, rate limiting, penetration testing, and production infrastructure are outside this demo's current scope.

## Generated evidence

- `evidence/qa-evidence.json` — run-owned aggregation (generated and ignored by Git).
- `evidence/raw/` — unit, Playwright, PostgreSQL, security, integration, and k6 sources.
- `reports/allure-current/index.html` — combined current Playwright report.
- `reports/allure-current/provenance.json` — run provenance.
- `reports/allure-current/qa-evidence.json` — evidence copied into the publishable report.
- `test-results/` — failure artifacts when a test fails.

CI produces separate Linux-runner values and publishes only after every quality gate passes. The public `provenance.json` and `qa-evidence.json` identify the exact deployed commit and workflow run.

## Residual risk

Residual-cent distribution, eligibility, shipping, discounts, mixed-seller behavior, real provider reconciliation/webhooks, Product-defined concurrency responses, authentication/authorization, full accessibility conformance, and production performance remain unproven. Passing evidence supports a bounded level of confidence; it does not imply a defect-free or production-ready financial platform.
