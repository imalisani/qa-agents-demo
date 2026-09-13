# BUG-001 — Invalid currency text can create a refund

- Severity: High within the demo; incorrect financial input interpretation.
- Classification: application validation defect.
- Preconditions: local demo server running; fresh order with USD 120 remaining.
- Reproduction: enter `40abc` in Refund amount and click Request partial refund.
- Expected: reject the invalid currency input and leave history and totals unchanged.
- Actual before the fix: the plain text field is valid and `Number.parseFloat('40abc')` produces 40, allowing the request. `40.001` is also silently rounded to whole cents.
- Cause: no currency-format constraint; permissive parsing followed by rounding.
- Regression: RF-T21 covers empty, zero, negative, alphabetic, mixed and fractional-cent values. It checks input validity, focus, absence of POST requests and unchanged API state.
- Fix: native currency pattern and accessible help, explicit positive/safe integer-cent validation, conversion from dollar and cent text without rounding. Input correction clears custom validity.
- Reproduced on 2026-09-13: Chromium RF-T21 with `40abc` failed before the fix (`validity.valid` was true instead of false); Playwright generated screenshot, video and trace. Generated failure artifacts are not versioned.

This is an input-validation fix, not a decision about proportional residual-cent allocation. Q-02 remains open.
