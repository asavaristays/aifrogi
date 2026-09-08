# Bucket 2 — human handover acceptance

Scope: shared website widget and standalone runtime. WhatsApp transport and connectors excluded. This is controlled-pilot engineering acceptance, **not 95% answer accuracy, enterprise certification, or a scale/load test**.

Status: **Accepted for controlled-pilot scope**, with all 15 required cases mapped below. Final release deployed and smoke verified. Evidence types and residual limits are explicit; this is not an assertion that every case was exercised against real customer traffic.

## Required manifest — 15 cases, no omitted cases

| Case | Expected result | Evidence collected |
| --- | --- | --- |
| B2-01 | Durable tenant-scoped human request | Actual handler fixture and two labelled live QA conversations in Webtechnosys inbox |
| B2-02 | No callback fields without consent | Handler fixture; both live QA conversations displayed no consent/contact |
| B2-03 | Repeated request creates no duplicate request/notification jobs | Handler repeated-request fixture; reconciler repeated-run fixture and rollback-only real DB probe produce exactly REQUEST + OVERDUE jobs |
| B2-04 | Disabled/unavailable handover makes no connected promise | Disabled-handler fixture; live enabled acknowledgment explicitly says human has not joined |
| B2-05 | Unauthorised/foreign-tenant operators denied | Actual operator-route fixtures: no login, viewer, foreign workspace, sender impersonation; request body cannot override trusted operations scope |
| B2-06 | AI pauses under human ownership; explicit authorised resume only | Live standalone visitor follow-up was saved without AI advice; owner resume restored approved support-phone answer; agent resume-denial fixture |
| B2-07 | Operator sees context, replies, and assignment is recorded | Both labelled QA conversations in authenticated client inbox; operator handler assignment/audit fixture |
| B2-08 | Correct visitor receives operator reply on both surfaces | Standalone live test (batch 2); embedded endpoint live test (batch 3), exact labelled replies observed |
| B2-09 | Reconnect preserves recent transcript and ownership without repeated human reply | Embedded Chrome reload preserved guest, AI and human messages; operator reply appeared once; HUMAN_JOINED restored; cursor/closed pagination fixtures |
| B2-10 | Read receipts are scoped to visitor/agent messages | Actual PATCH fixture submits own + foreign + AI IDs; only own AGENT message updated. Live embedded visible reply produced Visitor read: Confirmed |
| B2-11 | Closure preserves final reply; transitions audited | First QA closure observed in Chrome after user completed it. Second QA explicitly closed through inbox, visitor displayed closed with final reply retained; close/resume audit fixtures |
| B2-12 | Intended test mailbox receives notification | Single labelled direct test to info@webtechnosys.com, user confirmed receipt. Separately, scheduler job for first QA queried as SUCCEEDED / attempt 1 / smtpAccepted true / not skipped |
| B2-13 | SMTP failure remains visible and retry bounded | Mail rejection fixture; actual worker functions tested for RETRY, third-attempt DEAD, stale lease rejection and fenced completion; UI exposes retries/dead letters |
| B2-14 | Configured deadline creates responsible overdue action | Real DB rollback-only scoped probe creates one overdue and one request job, validates recipient selection in dry-run, then verifies all probe records absent. No test overdue email sent |
| B2-15 | Persistence failure gives no success and retry recovers cleanly | Handler evidence-outage fixture proves zero saved transcript/request/session, then exactly one after recovery; real DB temporary-row probe verifies rollback and successful commit |

## Real database verification

`scripts/verify-bucket-two-database.ts` exercised the actual database:

- Rejected persistence response rolled back a temporary write; success committed it.
- Overdue reconciliation repeated twice created exactly two scoped jobs. All probe operation/jobs rolled back; no mail sent.
- A held advisory lock rejected concurrent work (409), then reacquisition succeeded after release.
- These are real database primitives with synthetic data, not a real-user load test or proof of arbitrary failure interleavings.

The initial standalone probe completed its assertions but exited via SIGABRT during implicit process shutdown. The runner now exits explicitly **after awaited assertions and database cleanup**; rerun returned code 0. Production was not changed to suppress errors. The underlying implicit-shutdown behavior is an operational follow-up, not claimed root-caused.

## Live evidence identifiers

- Standalone QA lead: `cmton4enk002g1kkxrux8m3y3`, label `QA B2 acceptance 20260905`.
- Embedded QA lead: `cmtop63qf0014a8kx1j25yu43`, label `QA B2 embedded reconnect test`.
- Both closed; no booking/payment/knowledge publication performed. These conversations must remain classified as synthetic, not customer accuracy data.
- Confirmed test mail ID: `<25b6a860-4bce-b808-07a7-dbc1b46415c8@aifrogi.com>`.

## Explicit limits carried into pilot monitoring

- Retry deduplication covers durable handover and notification **jobs**. SMTP is at-least-once: acceptance followed by a process crash may cause an ambiguous repeat. No exactly-once SMTP claim.
- Transcript + request + evidence + session now share one persistence transaction. A user manually resending after a successful response was lost can still create another chat message. This does not create a second handover request; message-level replay receipts are future hardening.
- Same-tab recent transcript cache retains at most 200 messages in sessionStorage. It is not cross-device recovery or an unlimited transcript archive; server-side history remains in the client inbox. Blocked browser storage falls back to in-memory chat.
- Read means a human reply was visibly rendered, not proof a person understood it. Hidden-tab delivery must not be described as read.
- Actual embedded endpoint was tested in Chrome; every third-party CMS/iframe permission combination is not certified.
- Real overdue routing was dry-run validated. Ongoing production monitoring must verify deadline handling and recipient delivery; no new contractual SLA introduced.
- No score increase, no automatic knowledge learning, no persona-accuracy claim. Bucket 3 remains separate.

## Regression and deployment record

Local full core: 252/252 and TypeScript passed before final build. Bucket 1 manifest remains required. VPS staging uses explicit focused filenames because its package lacks the local `test:core` shortcut; a missing shortcut was not a failing test.

Final VPS focused tests: **58/58**, zero skipped. Production build passed. Bucket 1 manifest: **21/21** retained.

- Release: `bucket2-handover-final-20260905`.
- Readiness: `2026-09-05T18:23:28.227Z`.
- Rollback: `/var/backups/aifrogi/bucket2-final-20260905.2gcWex`.
- Post-deployment synthetic HTTP smoke: support phone, training booking, affirmative follow-up all 200 with correct approved information and saved evidence.
- Evidence IDs: `cmtopovhe001xu9kx3mj79e7i`, `cmtopoy3j0029u9kxocwaurjj`, `cmtopoyaq002lu9kxbokky6g8`.
- No schema migration, tenant deletion, payment, booking or knowledge publication.

Bucket 3 persona-specific evaluation can proceed next. Keep the operational limitations above in the pilot monitoring checklist; do not convert this acceptance into an accuracy percentage.
