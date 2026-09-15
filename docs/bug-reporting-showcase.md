# Controlled Defect Showcase

## Purpose

This is an intentionally controlled failure used to demonstrate the complete QA failure-analysis and bug-reporting workflow. The application itself is not intentionally broken.

## Run the showcase

```text
npm run test:bug-showcase
```

The command is expected to exit non-zero with exactly one failed test. The failure should be the business assertion that expects `$80.00` and receives the controlled UI value `$120.00`.

Generate the separate Allure report after the test run:

```text
npm run allure:bug-showcase
```

## Evidence locations

- Allure results: `allure-results/bug-showcase/`
- Allure report: `reports/allure-bug-showcase/`
- Playwright HTML report: `reports/playwright-bug-showcase/`
- Screenshot, video, and trace: `test-results/bug-showcase/`
- Bug report source: `reports/bug-showcase/BUG-REF-001.md`

The showcase is excluded from the normal test commands, CI quality gate, QA Evidence Pack, and current verified Allure report. Heavy runtime artifacts are ignored by Git.
