# Section 05: Automation Engine

Status: First executor slice implemented on 2026-07-03
Target score: 8.5/10

## Think

Primary user: a Client Admin automating repeatable customer work while keeping people in control of exceptions.

Primary job: turn approved triggers into observable actions that are reliable, reversible, explainable, and safe.

## Product Flow

Approved trigger -> Eligibility and consent -> Conditions -> Quiet-hours decision -> Action reservation with idempotency key -> Execute -> Observe result -> Retry or dead-letter -> Human intervention when required -> Audit and outcome analytics.

## Implementation Blocks

1. Durable workflow, version, trigger, step, run, job, and event models.
2. Worker with leases, locks, idempotency, exponential retry, and dead-letter handling.
3. Quiet hours, frequency caps, consent gates, and workspace limits.
4. Pause, resume, cancel, retry, test, and rollback controls.
5. Initial approved templates: audit intake, trial intake, missed reply, human handoff, lead qualification, and callback booking.
6. Run timeline, failure explanation, and operator intervention queue.
7. Visual builder only after executor acceptance, with trigger, condition, action, test, publish, and version states.

## Acceptance Gates

- Replayed events and worker restarts do not duplicate customer actions.
- Every action is attributable to a workflow version and triggering event.
- A workflow can be paused immediately and safely resumed.
- Quiet hours, opt-outs, consent, and frequency limits are enforced centrally.
- Failed jobs are visible, retryable, and never silently discarded.
- AI cannot add unapproved tools, recipients, promises, or message content.

## Achieve Definition

The section is complete when timed and event-driven workflows survive process restarts, remain auditable, and can be operated safely by a non-technical Client Admin.

## 2026-07-03 Implementation Slice

This slice deliberately avoids a visual workflow builder. The product now has the reliability layer that must exist before drag-and-drop automation is safe.

### Added

- Durable `AutomationJob` model tied to each client workspace.
- Idempotency key per job so repeated triggers do not duplicate work.
- Worker claim leases with `lockedBy`, `lockedAt`, and `leaseExpiresAt`.
- Attempt tracking, retry state, exponential backoff, and dead-letter status.
- Safe executor actions for internal notes, follow-up reminders, human handoff flags, and digest simulation.
- Manual API operations:
  - `GET /api/automation/jobs` for queue summary and recent jobs.
  - `POST /api/automation/jobs` with `enqueue_demo` for a safe digest simulation.
  - `POST /api/automation/jobs` with `run_due` to execute due jobs in dry-run mode.
- Workflow dashboard queue health: due now, queued, retry, dead-letter, recent attempts, and next due time.
- Verification script: `npm run verify:automation`.

### Guardrail

The first executor records safe internal outcomes only. It does not send WhatsApp messages, spend Meta balance, or create customer-facing automation until the queue proves reliable in production.

### Next Slice

1. Add central consent, opt-out, quiet-hours, and frequency-cap checks before any message action.
2. Add workflow run timeline and event table once job execution patterns stabilize.
3. Connect approved Section 04 campaign templates to scheduled jobs.
4. Add operator controls: pause, resume, retry, cancel.
5. Start the visual builder only after the executor handles real scheduled workflows without duplicate actions.
