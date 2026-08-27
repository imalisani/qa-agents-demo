---
name: api-testing
description: Analyze, design, implement, or execute API tests for HTTP services, including contracts, authentication, validation, errors, state changes, and integrations.
---

# API Testing

Derive tests from the API contract, requirement, implementation, and existing test conventions. If the contract is unavailable or ambiguous, identify the gap instead of assuming fields or status codes.

## Coverage

Evaluate as applicable:

- Method, route, headers, parameters, and request body
- Successful response status, schema, headers, and semantics
- Required, optional, null, malformed, boundary, and unknown fields
- Authentication, authorization, tenant and ownership boundaries
- Idempotency, duplicate requests, concurrency, and state transitions
- Pagination, filtering, sorting, and rate limits
- Dependency failures, timeouts, retries, and error contracts
- Data persistence and downstream side effects
- Sensitive-data exposure in responses and logs

## Execution

Reuse repository clients, fixtures, factories, and cleanup mechanisms. Keep tests deterministic and isolate created data. Validate both the response and relevant system state. Do not depend only on status codes.

When reporting results, include environment, endpoint or operation, test data constraints, observed response, state verification, and evidence. Treat undocumented but consistent behavior as a requirement question, not automatically as a defect.
