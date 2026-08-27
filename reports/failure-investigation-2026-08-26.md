# Failure investigation — initial browser run

## Failure summary

The first `npm.cmd test` run completed four API-only checks and failed two browser checks before page interaction. The process was interrupted after the six test attempts because cleanup did not complete in the sandboxed session.

## Evidence observed

- Passed: RF-T03, RF-T04, RF-T05, RF-T06.
- Failed: RF-T01 and RF-T02.
- Both failure contexts reported `browserType.launch` could not access the expected Chromium headless-shell executable.
- The failures occurred during browser launch, before product behavior was exercised.
- Chromium had been successfully downloaded outside the restricted workspace.

## Investigation

1. Confirmed Playwright discovered all six configured tests.
2. Confirmed API-only tests could execute without launching a browser.
3. Inspected both generated `error-context.md` files; they contained the same missing/inaccessible executable error.
4. Verified the workspace process lacked permission to inspect the external Playwright browser directory.
5. Re-ran the same suite with permission to launch the installed browser, without changing application code, assertions, retries, or timeouts.
6. The second run passed all six tests in 5.9 seconds.

## Classification

- Classification: **Environment issue**
- Confidence: **High**
- Product defect: **No**
- Automation defect: **No evidence**

## Resolution

Grant browser-launch access in restricted environments, or install/run Playwright in an environment where its browser cache is accessible. No product or test logic change was required.
