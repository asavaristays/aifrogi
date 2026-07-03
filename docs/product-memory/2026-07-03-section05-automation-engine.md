# Product Memory: 2026-07-03 Section 05 Automation Engine

## Decision

Section 05 starts with the durable executor, not the visual builder. AiFrogi should earn trust by executing safely, retrying predictably, and showing failures clearly before we let users design complex workflows.

## Implemented

- Added durable automation jobs with workspace ownership, idempotency, trigger metadata, workflow version, payload, result, lease fields, retry attempts, and dead-letter reasons.
- Added `lib/automation-engine.ts` as the queue and executor boundary.
- Added safe internal action types:
  - `INTERNAL_NOTE`
  - `FOLLOW_UP_REMINDER`
  - `HUMAN_HANDOFF`
  - `DAILY_DIGEST_SIMULATION`
  - `FAIL_VERIFICATION` for verification only
- Added `/api/automation/jobs` for queue inspection, safe demo enqueue, and dry-run due-job execution.
- Added Workflows page executor health cards and recent job timeline.
- Added `npm run verify:automation`.

## Product Principle

Client admins should see automation as a calm operating layer: what is due, what succeeded, what is retrying, and what needs human review. Meta/API complexity remains behind the scenes.

## Boundary

No external WhatsApp send action is enabled in this first slice. Customer-facing sends must wait for central consent, opt-out, quiet-hours, frequency-cap, and template checks.

## Next

Implement central safety gates, then wire campaign/template follow-ups to jobs, then add pause/resume/retry controls, and only then begin the visual workflow builder.
