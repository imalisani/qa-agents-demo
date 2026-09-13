# Quality pipeline

## Execute locally

```bash
npm ci
npx playwright install chromium
npm run validate
npm run allure:generate
npm run allure:open
```

Use Node 24+ and Java 17+. Unit tests use Node's native test runner with a 90% branch threshold scoped to `app/refund-store.mjs`. No coverage number is claimed for the whole application.

The in-memory demo exposes one order, so tests run with one worker. A shared fixture checks `/api/reset` before each local Playwright test. These tests do not establish concurrency, authentication or durable persistence guarantees. The external `portfolio-showcase` project runs only when explicitly requested and is not part of the gate.

## Evidence and failures

`Quality gate` installs dependencies, checks lint/types, executes unit tests with coverage and runs API, UI and axe/keyboard checks. Test failures remain failures: no `continue-on-error` is used. Unit output passes through Bash with `pipefail`, so a failing coverage threshold cannot be hidden by `tee`.

Allure generation runs after successful or failed Playwright execution. Reports, raw results, unit output, JSON metadata and available failure traces/screenshots/videos are uploaded as `qa-evidence-<run-id>` for 14 days. Fresh results are kept in `allure-results/current/` and `reports/allure-current/`; historical curated evidence remains under `reports/allure/`.

The Allure page lists only Playwright tests. Unit results are in the artifact/log; deployment smoke results have their own `deployment-evidence-<run-id>` artifact.

## Publication

Only a successful quality job on `main` uploads the Pages artifact. `Publish verified report` depends on that job. PRs and manual runs on other branches cannot publish. The public report includes the exact commit and run ID in `provenance.json`, and keeps the historical curated report under `/archive/`.

`Published report smoke test` waits for the expected provenance, rejects empty/failed reports, and verifies visible test suites in Chromium. A smoke failure marks the workflow red and retains diagnostic artifacts; it does not roll back the already published report.

Production runs are serialized per ref without canceling an in-progress deployment. Superseded PR runs are canceled. GitHub may replace queued pending runs, so the workflow guarantees checks for the deployed commit, not publication of every intermediate push.

## Merge protection

Require the `Quality gate` status check on `main`, with the PR branch up to date before merging. No approval from a second reviewer is needed for this solo portfolio. The workflow gates publication independently; repository protection is what enforces the PR merge rule. Administrative configuration is verified separately from the YAML.

## Portfolio explanation

“I built a GitHub Actions quality gate with domain tests and branch coverage, Playwright API/UI checks, automated accessibility checks and diagnostic artifacts. Successful main runs publish a fresh Allure dashboard. A browser smoke test verifies the published commit and results.”

The regression suite also reproduces and fixes [BUG-001](bugs-reports/BUG-001-invalid-refund-input.md): permissive currency parsing created a refund from mixed input such as `40abc`.

References: [Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing), [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
