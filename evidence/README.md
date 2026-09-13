# Execution evidence

Playwright writes real run artifacts to these locations:

- `execution-results.json`: machine-readable execution metadata.
- `../reports/playwright-html/`: interactive HTML report.
- `../allure-results/current/`: fresh raw Allure execution results.
- `../reports/allure-current/`: current dashboard, created by `npm run allure:generate`.
- `../reports/allure/`: preserved historical curated dashboard, published under `/archive/`.
- `../test-results/`: per-test traces, screenshots, and videos retained on failure.
- `videos/ecommerce-showcase.webm`: canonical video generated only by `npm run test:portfolio`.
- `../reports/allure-portfolio/`: isolated Allure dashboard for the showcase run.

Fresh reports and artifacts are generated, not authored, and ignored by Git. The curated historical report and showcase video remain versioned. A concise verified run summary is committed at `../reports/execution-summary.md`.

GitHub Actions keeps `qa-evidence-<run-id>` and `deployment-evidence-<run-id>` for 14 days. The former includes unit-test coverage output and Playwright evidence; the latter contains the public-report smoke test. `provenance.json` in the published report identifies the exact commit and workflow run.

For a portfolio demonstration, run `npm run test:portfolio`. The dedicated project records video without changing the normal suite's speed or video policy. Review `videos/ecommerce-showcase.webm`, then copy it to the portfolio repository's public assets directory.
