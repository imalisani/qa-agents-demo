# Playwright execution summary

## Verified run

- Timestamp: 2026-08-27 04:22:49 UTC
- Project: `chromium`
- Command: `npm.cmd run test:portfolio`
- Result: **6 passed, 0 failed, 0 flaky, 0 skipped**
- Duration reported by Playwright JSON: **4.80 seconds**

## Scenarios executed

| ID | Priority | Result |
|---|---|---|
| RF-T01 | Critical | Passed |
| RF-T02 | High | Passed |
| RF-T03 | Critical | Passed |
| RF-T04 | Critical | Passed |
| RF-T05 | Critical | Passed |
| RF-T06 | High | Passed |

## Generated evidence

- `reports/playwright-html/index.html`
- `evidence/execution-results.json`
- `test-results/.last-run.json`
- Two real `.webm` recordings for the UI scenarios, attached under `reports/allure/data/attachments/`.

The API-only scenarios do not open a browser and therefore do not produce videos. The two UI scenarios were recorded by the portfolio command and are available from the generated Allure report.
