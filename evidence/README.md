# QA Evidence Pack

The evidence contract is generated from real execution outputs; values are never hardcoded as portfolio claims.

## Stable machine-readable summary

`npm run evidence:generate` reads:

- `raw/unit-tests.txt` — executed unit count and branch coverage;
- `raw/functional.json` — API, UI, and accessibility results;
- `raw/integration.json` — simulated-provider resilience results;
- `raw/security.json` — security-focused results;
- `raw/data.json` — PostgreSQL and direct SQL results;
- `raw/k6-summary.json` — workload, thresholds, latency, failures, throughput, requests, and checks.

It writes `qa-evidence.json` with schema version, result status, commit, run ID, layer counts, coverage, performance observations, gate outcomes, and limitations. CI requires all six evidence sources and publishes this file beside Allure. A partial local run is labeled `partial`; a missing required source or failed gate is labeled `failed`.

Generated JSON and raw outputs are ignored by Git because they belong to a specific run. The verified main-run version is public at <https://imalisani.github.io/qa-agents-demo/qa-evidence.json> and included in the Actions artifact.

## Other evidence locations

- `../reports/allure-current/` — combined current Allure report plus evidence/provenance.
- `../reports/playwright-functional/` — functional layer HTML.
- `../reports/playwright-integration/` — simulated integration layer HTML.
- `../reports/playwright-security/` — security layer HTML.
- `../reports/playwright-data/` — PostgreSQL layer HTML.
- `../test-results/` — traces, screenshots, and videos retained on failure.
- `videos/ecommerce-showcase.webm` — curated historical showcase only.
- `../reports/allure/` — curated historical report, kept separate from current CI evidence.

Passing regression runs do not record video. Accessibility results attach axe JSON. Failure artifacts must be investigated before they are classified as product defects.
