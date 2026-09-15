# BUG-REF-001

## Title

Partial refund displays stale remaining refundable amount

## Type

Controlled defect showcase

## Severity

High

## Environment

QA demo / Playwright controlled defect simulation

## Preconditions

- Order total: $120.00
- No previous refunds

## Steps to reproduce

1. Open the refund demo.
2. Enter $40.00 as a partial refund.
3. Submit the refund.
4. Observe the remaining refundable amount.

## Expected result

Remaining refundable amount is $80.00.

## Actual result

Remaining refundable amount is displayed as $120.00 in the controlled defect scenario.

## Business impact

The refund succeeds, but the customer sees an incorrect financial balance and may believe the original amount is still refundable.

## Evidence

- Dedicated Allure failed test
- Failure screenshot
- Complete Playwright video
- Playwright trace

## Important disclosure

This defect is intentionally simulated at test level for QA portfolio demonstration. The normal application and quality gate are not intentionally left broken.
