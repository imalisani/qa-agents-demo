---
name: data-validation
description: Validate persistence and data integrity through API-to-database reconciliation, SQL constraints, atomicity, idempotency, and concurrency checks.
---

# Data validation

## Method

1. Identify the business invariant and authoritative records before querying data.
2. Confirm the persistence mode, schema, isolation strategy, and cleanup behavior.
3. Drive behavior through the public interface, then query the database independently.
4. Reconcile identifiers, amounts, allocations, status, counts, and immutable source fields.
5. Exercise failed writes, uniqueness, transaction rollback, and concurrent operations where justified.
6. Use parameterized SQL and dedicated test credentials; redact secrets from evidence.

## Decision boundaries

- Do not infer correctness from an HTTP success alone.
- Do not mutate production or shared data.
- Do not claim a concurrency contract when only the invariant is confirmed.
- Distinguish application validation from database-enforced protection.

## Evidence

Record setup, API action, focused SQL query, expected invariant, observed rows, cleanup, and residual risk. Prefer small queries that make the reasoning visible.
