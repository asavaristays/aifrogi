# Section 04: Campaigns And Compliance

Status: Governed immediate and scheduled campaign path implemented; awaiting customer acceptance
Target score: 8.5/10

## Think

Primary user: a Client Admin preparing a lawful WhatsApp campaign without remembering Meta template names or technical parameters.

Primary job: select the right opted-in audience, preview an approved message, understand estimated cost, test safely, send or schedule, and measure replies.

## Product Flow

Campaign objective -> Audience segment -> Consent evidence check -> Approved Meta template -> Variables and media -> WhatsApp preview -> Internal test -> Final audience diff and charge ceiling -> Send or schedule -> Delivery/read/reply/opt-out analytics -> Follow-up or stop.

## Implementation Blocks

1. Meta template catalogue synchronization with category, language, header, status, and preview.
2. Consent ledger with source, scope, timestamp, proof, and opt-out history.
3. Guided campaign wizard replacing manual template-name and number entry.
4. Saved segments, exclusions, deduplication, and suppression.
5. Test send, final confirmation, cost ceiling, scheduling, and cancellation.
6. Durable run history and recipient-level delivery explanations.
7. Reply, conversion, opt-out, and estimated-spend analytics.

## Implemented Increment 1

- Added campaign compliance fields to persisted campaign runs and recipients:
  - template status,
  - consent source,
  - consent proof,
  - consent confirmation actor/time,
  - audience snapshot,
  - test-mode flag,
  - recipient consent status,
  - suppression reason placeholder.
- Added a governed local template catalogue with the correct approved `goa_ai_audit_image_v2` image template, approved text templates, and pending template visibility.
- Bulk campaign API now requires authentication, validates the selected template against the approved catalogue, blocks pending/unknown templates, requires consent proof, and records the consent audit trail.
- Campaign page now passes approved templates, consent source options, recent campaign runs, and aggregate campaign analytics into the client UI.
- Replaced raw template-name entry with a guided wizard: template, audience, consent, confirmation.
- The UI now supports internal test send mode, approved test DB fill, recent-contact fill, template preview, default image header, estimated Meta charge, and recent run analytics.
- Added synthetic `npm run verify:campaigns` verifier covering template blocking, consent validation, campaign persistence, recipient audit fields, finalization, summary metrics, and cleanup.

## Implemented Increment 2

- Campaigns can be scheduled and canceled before execution.
- A protected cron executor processes due campaign jobs using idempotent reservations.
- Immediate and scheduled sends enforce subscription state, plan allowance, consent evidence, quiet hours, opt-out suppression, and a 24-hour frequency cap.
- Scheduled sends preserve template variables and media context without exposing credentials.
- Dry-run automation cannot consume a customer-facing campaign job.

## Acceptance Gates

- Unapproved templates and suppressed contacts cannot be sent.
- Audience changes after preview are shown before final confirmation.
- Retries cannot duplicate a recipient send.
- Scheduled campaigns can be paused or cancelled.
- Every recipient has consent evidence and an auditable outcome.
- Errors show cause, impact, owner, and recovery.

## Achieve Definition

The section is complete when a Client Admin can launch and evaluate a compliant campaign without entering raw Meta identifiers or asking support to inspect credentials.
