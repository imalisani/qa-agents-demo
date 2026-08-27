# Portfolio evidence guide

## Strong artifacts to show

- `test-plans/refund-requirement-analysis.md`: proof that ambiguity is discovered before automation.
- `test-plans/refund-risk-assessment.md`: risk prioritization and traceability.
- `test-plans/refund-test-plan.md`: automated versus blocked coverage.
- `agents/qa-orchestrator.md`: responsibility routing.
- `skills/playwright-testing/SKILL.md`: reusable capability instructions.
- `tests/refund/`: readable Critical/High automation.
- `reports/execution-summary.md`: concise result from a real run.
- `reports/playwright-html/`: interactive local report; publish as a separate static artifact if desired.

## Record a real execution video

The default configuration retains video only on failure. For a curated successful-run recording, use the dedicated command:

```bash
npm run test:portfolio
```

This runs only the external ecommerce showcase in the headed `portfolio-showcase` project and generates its isolated Allure report at `reports/allure-portfolio/index.html`. Its moderate `slowMo` and short pauses apply only to that project. The canonical video is copied to `evidence/videos/ecommerce-showcase.webm`; Playwright also retains its run-owned `.webm` under `test-results/`. The historical report at `reports/allure/` is not overwritten.

The test uses `PORTFOLIO_USER_EMAIL` and `PORTFOLIO_USER_PASSWORD` when both are set. Otherwise it creates a disposable Automation Exercise account through the public test API and deletes it after recording.

```powershell
$env:PORTFOLIO_USER_EMAIL = 'your-test-user@example.com'
$env:PORTFOLIO_USER_PASSWORD = 'your-test-password'
npm run test:portfolio
```

To publish the recording, copy `evidence/videos/ecommerce-showcase.webm` to the portfolio repository's public assets directory. For example, a real destination of `public/videos/ecommerce-showcase.webm` would be referenced as `/videos/ecommerce-showcase.webm`. Do not create that path until the portfolio workspace is available, and never commit credentials.

## Linking from a portfolio later

Use real URLs only after publishing:

- GitHub repository URL for **View code**.
- Hosted static Playwright report URL for **View report**.
- Hosted `.webm` or converted accessible video asset for **Watch execution**.

Keep these links configurable in the portfolio until those assets have been published.
