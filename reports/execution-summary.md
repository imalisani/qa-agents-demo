# Quality execution summary

## Verified run

- Date: 2026-09-13
- Environment: Windows, Node 24.13.0, Chromium, local deterministic demo.
- Project: `chromium`
- Command: `npm.cmd run validate`, followed by `npm.cmd run allure:generate`.
- Lint and TypeScript: passed.
- Domain unit tests: **4 passed**, covering 12,000 single-refund amounts inside the conservation test.
- Domain coverage: **96.67% lines, 93.75% branches, 100% functions**; branch gate is 90%.
- Playwright: **33 passed, 0 failed, 0 flaky, 0 skipped** in **18.6 seconds**.
- Fresh Allure generation: passed with 33 results.
- Deployment smoke against the locally served generated report: **1 passed** in 2.0 seconds; validates provenance and opens the Chromium suite.
- These are local verification results. The Actions run and published provenance identify the separate Linux CI execution.

## Scenarios executed

| ID | Priority | Result |
|---|---|---|
| RF-T01 | Critical | Passed |
| RF-T02 | High | Passed |
| RF-T03 | Critical | Passed |
| RF-T04 | Critical | Passed |
| RF-T05 | Critical | Passed |
| RF-T06 | High | Passed |
| RF-T13–RF-T17 | High/Low | 14 API cases passed |
| RF-T18–RF-T22, RF-T25 | Critical/High/Medium | 11 UI cases passed |
| RF-T23–RF-T24 | High | 2 accessibility cases passed |
| RF-U01–RF-U04 | Critical/High | 4 unit tests passed |

## Generated evidence

- `reports/playwright-html/index.html`
- `evidence/execution-results.json`
- `test-results/.last-run.json`
- `allure-results/current/`
- `reports/allure-current/index.html`
- `reports/allure-current/provenance.json`

Passing regression runs do not record videos. Failure traces, screenshots and videos remain enabled; axe JSON for initial and submitted states is attached to the accessibility result. Historical showcase recordings are preserved in `reports/allure/` and published under `/archive/`.

## Investigated failures

RF-T21 with `40abc` failed before the form fix. The captured page showed a USD 40 refund, USD 80 remaining, and the mixed input still present. The repaired form rejects this and other invalid inputs without a POST. See [BUG-001](../docs/bugs-reports/BUG-001-invalid-refund-input.md).

The first complete regression run also exposed a test-data construction issue: Playwright serialized the malformed JSON string as valid JSON. Sending a Buffer preserves the malformed bytes; the API then returns the expected JSON error. No application change was needed for this case.

Residual-cent distribution, real concurrency, provider outcomes and eligibility rules remain unproven as documented in the automation strategy. Automated axe/keyboard checks do not establish full accessibility compliance or screen-reader announcements.
