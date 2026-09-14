# Full-lifecycle quality pipeline

## Gate executed on every PR and main push

1. Install locked npm dependencies and Chromium.
2. Run ESLint and TypeScript checks.
3. Run domain/provider unit tests with a 90% branch gate.
4. Run functional API, UI, and accessibility checks.
5. Run API↔PostgreSQL reconciliation, constraint, idempotency, and concurrency checks.
6. Run deterministic simulated-provider integration checks.
7. Run security-focused API checks.
8. Run the k6 smoke profile against the local service.
9. Aggregate real outputs into `evidence/qa-evidence.json`.
10. Generate Allure and upload the complete run artifact.

The PostgreSQL 17 service is isolated to the job. The provider is simulated, deterministic, and enabled only for its dedicated suite. k6 thresholds are regression guardrails for this runner, not Product SLOs.

Test stages use `if: !cancelled()` after installation so later evidence can still be collected when an earlier test layer fails. There is no `continue-on-error`: a failed test or threshold still fails the quality job.

## Publication and deployment verification

Only a successful non-PR run on `main` uploads a Pages artifact. The artifact contains:

- the combined current Allure report;
- `provenance.json` with commit SHA, workflow run ID, generation time, and Allure counts;
- `qa-evidence.json` with every required gate, test breakdown, branch coverage, and k6 metrics;
- the curated historical report under `/archive/`.

The deployment job publishes that exact artifact. A final Chromium smoke test polls for the expected SHA/run ID, rejects failed or incomplete evidence, checks every full-lifecycle gate, and opens a visible refund suite. Deployment failures retain their own trace/report artifact.

## Failure evidence

The `qa-evidence-<run-id>` artifact is retained for 14 days and includes raw Playwright JSON, Allure results, layer-specific HTML reports, unit output, PostgreSQL results, k6 summary, performance-service log, and failure traces/screenshots/videos when available.

Published Pages content is the latest successful main run. Failed runs remain inspectable in Actions but cannot replace the public verified report.

## Local reproduction

Core memory-mode gate:

```bash
npm ci
npx playwright install chromium
npm run validate
```

PostgreSQL layer:

```powershell
docker compose up -d postgres
$env:DATABASE_URL='postgresql://qa_lab:qa_lab_local@127.0.0.1:5433/qa_lab'
npm run test:data
```

k6 layer, with `npm start` running in another terminal:

```bash
npm run test:performance:smoke
```

For a complete local evidence pack, keep the same `evidence/raw/` directory across layers, execute data and k6, then run:

```bash
npm run evidence:generate
npm run allure:generate
```

## Branch protection

Require the `Quality gate` status on `main` and require the PR branch to be current before merge. Workflow YAML gates publication; repository protection enforces the merge rule.
