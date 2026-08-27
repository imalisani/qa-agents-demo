# Execution evidence

Playwright writes real run artifacts to these locations:

- `execution-results.json`: machine-readable execution metadata.
- `../reports/playwright-html/`: interactive HTML report.
- `../allure-results/`: raw Allure execution results.
- `../reports/allure/`: generated Allure dashboard.
- `../test-results/`: per-test traces, screenshots, and videos retained on failure.

The HTML report and run artifacts are generated, not authored. They are intentionally ignored by Git because they can be large and environment-specific. A concise verified run summary can be committed at `../reports/execution-summary.md`.

For a portfolio demonstration, record a headed or UI-mode run separately and copy the selected video to the portfolio repository. Playwright's configured video policy retains video only for failures; change it temporarily to `on` for a deliberate portfolio recording, then restore it to avoid accumulating binaries.
