# Execution evidence

Playwright writes real run artifacts to these locations:

- `execution-results.json`: machine-readable execution metadata.
- `../reports/playwright-html/`: interactive HTML report.
- `../allure-results/`: raw Allure execution results.
- `../reports/allure/`: generated Allure dashboard.
- `../test-results/`: per-test traces, screenshots, and videos retained on failure.
- `videos/ecommerce-showcase.webm`: canonical video generated only by `npm run test:portfolio`.
- `../reports/allure-portfolio/`: isolated Allure dashboard for the showcase run.

The HTML report and run artifacts are generated, not authored. They are intentionally ignored by Git because they can be large and environment-specific. A concise verified run summary can be committed at `../reports/execution-summary.md`.

For a portfolio demonstration, run `npm run test:portfolio`. The dedicated project records video without changing the normal suite's speed or video policy. Review `videos/ecommerce-showcase.webm`, then copy it to the portfolio repository's public assets directory.
