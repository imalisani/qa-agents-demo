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

The default configuration retains video only on failure. For a curated successful-run recording, set `video: 'on'` temporarily in `playwright.config.ts`, run the selected test, and use the generated `.webm` from `test-results/`. Do not present a mocked terminal or fabricated result.

## Linking from a portfolio later

Use real URLs only after publishing:

- GitHub repository URL for **View code**.
- Hosted static Playwright report URL for **View report**.
- Hosted `.webm` or converted accessible video asset for **Watch execution**.

Keep these links configurable in the portfolio until those assets have been published.
