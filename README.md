# Agentic Quality Engineering Lab — Full Lifecycle

[![Quality pipeline](https://github.com/imalisani/qa-agents-demo/actions/workflows/publish-allure.yml/badge.svg)](https://github.com/imalisani/qa-agents-demo/actions/workflows/publish-allure.yml)

[Live Quality Evidence / Allure](https://imalisani.github.io/qa-agents-demo/) · [QA Evidence Pack (JSON)](https://imalisani.github.io/qa-agents-demo/qa-evidence.json) · [CI workflow](.github/workflows/publish-allure.yml) · [Risk-based test plan](test-plans/refund-test-plan.md)

A full-lifecycle Quality Engineering lab showing how a feature moves from requirement ambiguity and risk analysis to functional validation, data integrity, integration, security-focused testing, performance checks, continuous quality gates, and verifiable execution evidence.

This is not a repository built to collect testing tools. It is a portfolio project designed to show how quality decisions connect across a product lifecycle. Specialized QA agents support that process without inventing requirements, hiding uncertainty, or treating every failed test as a product bug.

## What this project demonstrates

| Quality capability | Implemented evidence |
|---|---|
| Requirement analysis | [Ambiguities, affected behavior, and Product questions](test-plans/refund-requirement-analysis.md) |
| Risk-based testing | [Business and technical risk assessment](test-plans/refund-risk-assessment.md) |
| Test strategy | [Prioritized, traceable Gherkin and explicit automation boundaries](test-plans/refund-test-plan.md) |
| UI and API quality | Playwright regression, validation, boundary, contract, and state checks in [`tests/`](tests/) |
| Accessibility | axe WCAG-oriented scans, keyboard operation, focus, and live-status checks in [`tests/a11y/`](tests/a11y/) |
| Data integrity | PostgreSQL transactions, direct SQL reconciliation, constraints, idempotency, and concurrency in [`tests/data/`](tests/data/) |
| Integration and resilience | Opt-in deterministic provider simulation for success, delay, failure, timeout, retry, and unknown outcomes |
| Security-focused QA | Trust-boundary, replay, malformed transport, oversized body, and server-owned state checks in [`tests/security/`](tests/security/) |
| Performance | k6 smoke, baseline, and load profiles with explicit demo/CI guardrails in [`performance/`](performance/) |
| Unit quality | Node unit tests with a 90% branch-coverage gate |
| Continuous quality | PostgreSQL-backed GitHub Actions pipeline, Allure publication, provenance, and deployment smoke |
| QA evidence | Generated [`evidence/qa-evidence.json`](evidence/README.md), Allure, raw outputs, artifacts, and commit/run provenance |
| Failure analysis | [Evidence-based failure classification](reports/failure-investigation-2026-08-26.md) before defect reporting |

## Full Quality Lifecycle

```mermaid
flowchart TD
    STORY[User Story] --> REQ[Requirement Analysis]
    REQ --> RISK[Risk Assessment]
    RISK --> STRATEGY[Test Strategy]

    STRATEGY --> UI[UI Testing]
    STRATEGY --> API[API Testing]
    STRATEGY --> A11Y[Accessibility]

    API --> DATA[Data Integrity / PostgreSQL]
    DATA --> INTEGRATION[Integration / Simulated Provider]

    UI --> SECURITY[Security-focused QA]
    API --> SECURITY
    DATA --> SECURITY

    INTEGRATION --> PERF[Performance / k6]
    SECURITY --> PERF
    PERF --> CI[CI/CD Quality Gates]
    CI --> EVIDENCE[QA Evidence Pack]
    EVIDENCE --> DECISION[Release Confidence + Residual Risk]
```

The diagram is an evidence flow, not a claim that quality is perfectly linear. Requirement and risk findings continue to constrain what later layers may assert.

## Architecture

The implementation keeps one controlled refund domain and changes the observation layer, not the business story.

```mermaid
flowchart LR
    CLIENT[Browser / API / k6] --> SERVER[Refund demo API]
    SERVER --> MEMORY[(Memory store)]
    SERVER --> POSTGRES[(PostgreSQL)]
    SERVER -. test mode only .-> PROVIDER[SIMULATED refund provider]
    PW[Playwright] --> CLIENT
    SQL[Direct SQL assertions] --> POSTGRES
    UNIT[Node unit tests] --> DOMAIN[Store + provider logic]
    SERVER --> EVIDENCE[Execution outputs]
    PW --> EVIDENCE
    SQL --> EVIDENCE
```

- **Memory mode** is the default: fast, isolated, and deterministic for UI/API regression.
- **PostgreSQL mode** uses row locking, transactions, uniqueness, and check constraints for persistence-level evidence.
- **SIMULATED PROVIDER** mode is opt-in and deterministic. It does not call or impersonate a real payment provider.

## Demo domain and User Story

> As a customer, I want to request a full or partial refund for a purchase so that I can recover the corresponding amount for products I no longer want to keep.

The refund domain is intentionally controlled but risk-rich: a USD 120.00 order paid with USD 90.00 card and USD 30.00 internal credit exposes financial invariants, allocation, idempotency, retries, partial state, concurrency, persistence, and provider uncertainty.

It is not a real financial production system. The [requirement analysis](test-plans/refund-requirement-analysis.md) deliberately leaves unresolved discount, shipping, eligibility, residual-cent, seller aggregation, provider reconciliation, and concurrency-response rules unresolved.

## Quality layers

### Functional quality

UI, API, boundary, negative, contract, regression, and user-visible state checks protect confirmed behavior. Playwright is used for both browser and HTTP validation so the suite can share fixtures, traceability, reporting, and failure evidence rather than duplicate the same coverage across frameworks.

### Data integrity and SQL validation

PostgreSQL exists because a successful API response cannot prove durable consistency. The data suite drives behavior through the API, then independently validates persisted rows and constraints.

It verifies:

- API ↔ database reconciliation for amount, allocation, status, and idempotency key;
- a unique persisted idempotency key;
- rollback/no partial write after an over-refund;
- immutable original payment values;
- paid-total protection during simultaneous writes;
- database rejection of an invalid financial allocation.

Memory and PostgreSQL modes are both intentional: one optimizes test speed, the other exposes persistence and transaction risk. The schema is in [`db/schema.sql`](db/schema.sql); the direct checks are in [`tests/data/`](tests/data/).

### Integration and resilience

The demo uses a **SIMULATED PROVIDER** to exercise controlled dependency behavior without relying on an uncontrolled third party. Supported scenarios are confirmed success, delayed success, rejection, timeout before acceptance, timeout after acceptance with an unknown outcome, and transient failure followed by retry.

This makes failure modes repeatable and allows local state, retry, and idempotency behavior to be asserted. It does not prove a real provider contract, webhook delivery, reconciliation, or final recovery semantics.

### Accessibility

Automated axe scans check serious/critical WCAG-oriented findings in initial and submitted states. Keyboard checks cover focus order, form operation, and the live result status. These checks reduce common barriers; they do not establish full WCAG conformance or replace screen-reader and human evaluation.

### Security-focused Quality Engineering

The security suite concentrates on product trust boundaries: malformed and oversized input, unsupported media types, unexpected properties, replay with changed input, server-owned financial/state fields, prototype-shaped JSON, and exposure of test-only provider controls.

The current demo does not implement user authentication or authorization, rate limiting, a secrets platform, or production infrastructure. Those areas are intentionally outside the current security-testing scope. This project is not presented as a penetration-testing lab.

### Performance testing with k6

[`performance/refund-api.js`](performance/refund-api.js) models read-only health, order, and refund-history traffic so performance runs do not compete over shared refund data.

| Profile | Workload | Intended use |
|---|---|---|
| Smoke | 1 virtual user, 5 iterations | Every CI run |
| Baseline | 3 virtual users, 15 seconds | Local comparison |
| Load | 10 virtual users, 30 seconds | Deliberate isolated run |

The CI guardrails are p95 HTTP duration below 500 ms, HTTP failures below 1%, and checks above 99%. They are **demo/CI regression guardrails, not a Product SLO**. Stress and soak do not run on every PR because this local service and shared CI runner are not capacity-test environments. Observed values are published only from real k6 output in the QA Evidence Pack.

### Continuous quality

CI makes the layers cumulative: code quality, unit branch coverage, functional behavior, accessibility, PostgreSQL, simulated integration, security checks, and k6 smoke must pass before the report can be published. Failed runs retain diagnostic artifacts but cannot replace the verified Pages report.

## Agentic QA architecture

Agentic QA remains a major differentiator, but it is used to decompose Quality Engineering decisions—not to claim that AI automatically tests everything.

- **Agent:** specialized responsibility and decision ownership.
- **Skill:** reusable QA methodology shared across agents.
- **Tool:** execution capability such as Playwright, PostgreSQL, SQL, axe, k6, or GitHub Actions.

| Agent | Decision ownership |
|---|---|
| [QA Orchestrator](agents/qa-orchestrator.md) | Workflow decomposition, dependencies, routing, and final synthesis |
| [Requirements Agent](agents/requirements-agent.md) | Ambiguities, business rules, Product questions, and affected behavior |
| [Risk Agent](agents/risk-agent.md) | Business, technical, integration, concurrency, data, and regression risk |
| [Test Design Agent](agents/test-design-agent.md) | Risk-prioritized scenarios and requirement traceability |
| [Automation Agent](agents/automation-agent.md) | What is objective, valuable, and safe to automate |
| [API Agent](agents/api-agent.md) | HTTP contract, validation, state, and side-effect coverage |
| [UI Automation Agent](agents/ui-automation-agent.md) | User-visible Playwright behavior and robust interaction design |
| [Accessibility Agent](agents/accessibility-agent.md) | Accessibility scope, automated findings, and manual-check boundaries |
| [Data Integrity Agent](agents/data-integrity-agent.md) | SQL reconciliation, constraints, atomicity, and persistence evidence |
| [Security Agent](agents/security-agent.md) | Trust boundaries, security-relevant behavior, and explicit exclusions |
| [Performance Agent](agents/performance-agent.md) | Workload, metrics, targets/guardrails, and runner limitations |
| [PR Analysis Agent](agents/pr-analysis-agent.md) | Change risk, affected coverage, and regression impact |
| [Failure Analysis Agent](agents/failure-analysis-agent.md) | Evidence-based failure classification before bug reporting |

Agents do not invent missing requirements. They do not silently broaden scope, and a failed check is not automatically a product defect.

### Reusable skills

Methodology lives in Skills so agents do not duplicate QA knowledge:

[`requirement-analysis`](skills/requirement-analysis/SKILL.md) · [`risk-analysis`](skills/risk-analysis/SKILL.md) · [`test-design`](skills/test-design/SKILL.md) · [`playwright-testing`](skills/playwright-testing/SKILL.md) · [`api-testing`](skills/api-testing/SKILL.md) · [`data-validation`](skills/data-validation/SKILL.md) · [`security-testing`](skills/security-testing/SKILL.md) · [`performance-testing`](skills/performance-testing/SKILL.md) · [`failure-investigation`](skills/failure-investigation/SKILL.md) · [`bug-reporting`](skills/bug-reporting/SKILL.md)

## Quality pipeline

```mermaid
flowchart LR
    CHANGE[PR / main push] --> STATIC[Lint + TypeScript]
    STATIC --> UNIT[Unit + 90% branch gate]
    UNIT --> FUNCTIONAL[API + UI + accessibility]
    FUNCTIONAL --> DATA[PostgreSQL data checks]
    DATA --> INTEGRATION[Simulated integration]
    INTEGRATION --> SECURITY[Security-focused checks]
    SECURITY --> PERF[k6 smoke]
    PERF --> PACK[Allure + QA Evidence Pack]
    PACK --> GATE{All gates pass on main?}
    GATE -- Yes --> PAGES[Publish verified report]
    PAGES --> SMOKE[Verify report + SHA + run ID + evidence]
```

PRs run the same quality job without publishing. Main publishes only after all gates pass. All test layers continue after an earlier test failure when possible so the artifact contains useful failure breadth; the job still remains red. The deployment smoke test waits for the final commit/run provenance and validates the published QA Evidence Pack. See [`docs/ci-pipeline.md`](docs/ci-pipeline.md).

## QA Evidence Pack

`npm run evidence:generate` derives `evidence/qa-evidence.json` from actual unit, Playwright, PostgreSQL, and k6 outputs. It includes:

- status, commit SHA, workflow run ID, and generation time;
- total/passed/failed tests and counts by quality layer;
- unit branch coverage and its gate;
- k6 profile, p95, failure rate, throughput, requests, and check rate;
- individual quality-gate outcomes;
- explicit evidence limitations.

The generated file is not hardcoded or committed as a timeless claim. CI publishes the run-owned version beside Allure at [qa-evidence.json](https://imalisani.github.io/qa-agents-demo/qa-evidence.json). Raw evidence and failure artifacts are retained in the workflow artifact. [`evidence/README.md`](evidence/README.md) documents provenance and locations.

### Where to verify the claims

- [Live Allure report](https://imalisani.github.io/qa-agents-demo/)
- [GitHub Actions quality pipeline](https://github.com/imalisani/qa-agents-demo/actions/workflows/publish-allure.yml)
- [Requirement analysis](test-plans/refund-requirement-analysis.md), [risk assessment](test-plans/refund-risk-assessment.md), and [test plan](test-plans/refund-test-plan.md)
- [PostgreSQL data tests](tests/data/refund-data-integrity.spec.ts)
- [Provider resilience tests](tests/integration/provider-resilience.spec.ts)
- [Security-focused tests](tests/security/refund-security.spec.ts)
- [k6 workload](performance/refund-api.js)
- [Latest human-readable execution summary](reports/execution-summary.md)
- [Historical curated showcase](https://imalisani.github.io/qa-agents-demo/archive/)

## Quick start

Prerequisites: Node.js 24+, npm, Chromium, Java 17+ for Allure, Docker for local PostgreSQL, and k6 for local performance commands.

```bash
npm ci
npx playwright install chromium
```

Core memory-mode quality gate:

```bash
npm run validate
```

Focused commands:

```bash
npm test                         # memory-mode Playwright suite
npm run test:unit               # unit tests + branch gate
npm run test:functional         # API + UI + accessibility
npm run test:integration        # deterministic simulated provider
npm run test:security           # security-focused API checks
```

PostgreSQL data checks:

```bash
docker compose up -d postgres
# PowerShell:
$env:DATABASE_URL='postgresql://qa_lab:qa_lab_local@127.0.0.1:5433/qa_lab'
npm run test:data
```

Performance checks require the demo to be running in another terminal:

```bash
npm start
npm run test:performance:smoke
npm run test:performance:baseline
npm run test:performance:load
```

Generate and open current core evidence:

```bash
npm run test:allure
npm run allure:open
```

## Project structure

```text
qa-agents-demo/
├── agents/                    # Specialized QA decision ownership
├── skills/                    # Reusable QA methodologies
├── app/                       # Refund API, memory store, PostgreSQL store, simulator
├── db/schema.sql              # PostgreSQL financial constraints
├── tests/
│   ├── api/                   # Validation and contracts
│   ├── ui/                    # Customer-visible regression
│   ├── a11y/                  # axe and keyboard behavior
│   ├── refund/                # Core risk-based scenarios
│   ├── data/                  # Direct PostgreSQL reconciliation
│   ├── integration/           # SIMULATED PROVIDER resilience
│   └── security/              # Security-focused trust boundaries
├── performance/               # k6 smoke, baseline, and load model
├── unit-tests/                # Domain and simulator branch coverage
├── deployment-tests/          # Published report/evidence verification
├── test-plans/                # Requirements, risks, strategy, and traceability
├── evidence/                  # Machine-readable evidence contract and generated outputs
├── reports/                   # Human summaries and curated historical evidence
├── scripts/                   # Evidence isolation, aggregation, and provenance
├── docs/                      # CI, evidence, bug, and portfolio guidance
├── .github/workflows/         # Full-lifecycle quality gate and Pages publication
├── compose.yaml               # Local PostgreSQL test service
└── package.json
```

## Design decisions

### Why keep memory persistence?

It makes functional tests fast, isolated, and deterministic.

### Why PostgreSQL too?

It makes transactions, concurrency, uniqueness, constraints, persistence, and API↔DB reconciliation directly testable.

### Why simulate an external provider?

Controlled outcomes make retry and resilience tests reproducible. The simulator is opt-in and clearly labeled so its evidence cannot be mistaken for a real integration certification.

### Why k6 instead of another UI framework?

Performance was a missing quality dimension. Another UI framework would duplicate existing behavior coverage rather than deepen lifecycle evidence.

### Why not Selenium, PyTest, Appium, Cypress, JMeter, or Postman collections here?

This flagship project demonstrates integration, architecture, traceability, and judgment across one lifecycle. Framework-specific breadth belongs in separate portfolio projects when those projects exist and are ready to show.

## What this lab is not

- It is not a production payment platform.
- It is not a claim that every quality dimension is exhaustively covered.
- It is not a collection of testing tools.
- It is not a penetration-testing environment.
- Simulated dependencies are explicitly labeled.
- Performance results describe a demo/CI environment, not a production capacity claim or SLO.

## Limits and residual risk

Current evidence supports confidence in the implemented financial boundary, retry behavior, controlled persistence, deterministic dependency failures, input/state protections, and CI publication path. It does not eliminate these known risks:

- residual-cent allocation, eligibility windows, shipping, discounts, and mixed-seller rules remain unresolved;
- the simulated provider does not prove real timeouts, webhooks, reconciliation, or third-party availability;
- PostgreSQL locking proves the paid-total invariant, but Product has not defined concurrent winner/response semantics;
- authentication, authorization, rate limiting, infrastructure hardening, and secret rotation are not implemented;
- automated axe/keyboard checks do not establish complete accessibility conformance;
- k6 results vary by runner and do not represent production load, stress, soak, or capacity;
- the local demo has one controlled order and no production observability or deployment topology.

The release message is therefore: **these risks were tested, these remain, and the published evidence supports the current bounded level of confidence.**

## Portfolio scope

`qa-agents-demo` remains the flagship full-lifecycle Quality Engineering project and keeps its current repository name, URL, GitHub Pages deployment, and existing references. Other portfolio repositories may demonstrate framework-specific depth; they are intentionally not linked here until their exact public URLs and readiness are verified.
