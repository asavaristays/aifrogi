# AiFrogi Support Operations v1

## Operating principle

The support ticket is the system of record. Email is a notification and reply transport. Every ticket remains tenant-bound, every operator view/reply is audited, and credentials must never be placed in a ticket or email.

## Lifecycle

`OPEN → ACKNOWLEDGED → INVESTIGATING → WAITING_FOR_CLIENT → RESOLVED → CLOSED`

- A client reply returns the ticket to `OPEN`.
- An AiFrogi reply puts it in `WAITING_FOR_CLIENT`.
- `RESOLVED` requires root cause, action taken, verification evidence, and prevention.
- The client confirms `CLOSED` or reopens an unresolved result.

## Service targets

| Priority | Acknowledge | Resolve |
|---|---:|---:|
| Urgent | 1 hour | 8 hours |
| High | 4 hours | 24 hours |
| Normal | 8 hours | 72 hours |
| Low | 24 hours | 120 hours |

Urgent is reserved for an unavailable live bot, unsafe behaviour, tenant isolation concern, or a failed live connector action. SLA state is computed from immutable ticket creation time and shown to operations.

## Email threading

All notifications contain `[LOS-YYYYMMDD-XXXXX]`. An authorized workspace owner/member can reply without changing that reference. The automation worker imports the reply into the same ticket once, rejects unknown senders and sensitive secrets, and records import/rejection evidence in the platform audit log.

## Access boundary

Ticket text is explicitly submitted for support and is visible to AiFrogi operators. This does not grant access to unrelated conversations, knowledge, contacts, billing data, or connector data; those remain under their existing customer-controlled access gates.

## Resolution quality gate

A ticket cannot be marked resolved without:

1. Root cause.
2. Corrective action.
3. Verification evidence or replay result.
4. Prevention, regression test, or monitoring control.

Recurring issues must be linked to the governed improvement system; support should not repeatedly compensate for a product defect.

## Operational checks

- SMTP/IMAP configuration must remain healthy for `info@aifrogi.com`.
- The automation cron runs email-reply import with an idempotency audit key.
- Overdue urgent/high tickets are reviewed before routine tickets.
- Never request or accept passwords, OTPs, API keys, bearer tokens, or card data.
- Email failure must not erase or roll back a successfully created ticket.
