# Section 05: Automation Engine

Status: Planned
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
