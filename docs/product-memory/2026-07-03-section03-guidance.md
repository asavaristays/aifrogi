# 2026-07-03 Section 03 Guidance Memory

Section 03 now has its second implementation layer beyond self-service registration.

## Implemented

- Shared guidance rules live in `lib/onboarding-guidance.ts`.
- Guidance outputs: title, description, action, owner (`You`, `AiFrogi`, or `Meta`), step, tone, ETA, and Super Admin support note.
- Trial windows are calculated for 30-day trial organizations from `Organization.createdAt`.
- Client onboarding shows a prominent `Today` action card before the checklist and form.
- Client onboarding sidebar shows trial days left and elapsed progress.
- Super Admin customer list shows next action, owner, ETA, trial status, and AiFrogi queue count.
- Super Admin customer detail shows the current blocker and support note above configuration.
- `npm run verify:registration` now verifies guidance and trial-window behavior.

## Product Meaning

The onboarding experience should no longer feel like disconnected forms. It should tell the customer and support team exactly:

- what is complete,
- what is next,
- who owns it,
- how long it normally takes,
- and why it matters.

## Remaining Section 03 Work

- Meta status reconciliation improvements.
- Template readiness and first test-message proof.
- Welcome/lifecycle emails after activation.
- More granular drop-off analytics beyond the activity timeline.
- Visual QA after the next deployment.
