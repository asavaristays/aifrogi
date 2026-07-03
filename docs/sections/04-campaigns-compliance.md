# Section 04: Campaigns And Compliance

Status: Planned
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

## Acceptance Gates

- Unapproved templates and suppressed contacts cannot be sent.
- Audience changes after preview are shown before final confirmation.
- Retries cannot duplicate a recipient send.
- Scheduled campaigns can be paused or cancelled.
- Every recipient has consent evidence and an auditable outcome.
- Errors show cause, impact, owner, and recovery.

## Achieve Definition

The section is complete when a Client Admin can launch and evaluate a compliant campaign without entering raw Meta identifiers or asking support to inspect credentials.
