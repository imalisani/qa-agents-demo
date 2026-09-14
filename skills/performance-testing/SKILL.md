---
name: performance-testing
description: Design and interpret smoke, baseline, and load checks with explicit workloads, metrics, guardrails, environment context, and non-SLO limitations.
---

# Performance testing

## Method

1. Define the transaction mix, environment, data state, virtual users, duration or iterations, and expected traffic shape.
2. Separate product SLOs, CI guardrails, and observed measurements. Never substitute one for another.
3. Start with a smoke profile, establish a repeatable baseline, then run load only in an isolated environment.
4. Capture p95 latency, failure rate, throughput, request count, check rate, and relevant resource/dependency evidence.
5. Compare like-for-like runs and investigate generator, network, warm-up, caching, and runner variability.

## Decision boundaries

- Do not run stress or soak tests on shared or production systems without authorization.
- A fast demo result does not predict production capacity.
- A CI threshold is a regression guardrail, not a business SLO unless Product has approved it.

## Evidence

Record the k6 profile, exact command, runner, thresholds, observed metrics, result, and limitations in machine-readable and human-readable form.
