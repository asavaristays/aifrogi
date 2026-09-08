# Bucket 2 — first implementation batch

Status: **Bucket 2 accepted for controlled-pilot scope**, deployed as `bucket2-handover-final-20260905`. See `AiFrogi-Bucket-2-Acceptance-2026-09-05.md` for final 15-case mapping and limitations. All open-item lists below are historical checkpoints superseded by that final acceptance record, not current blockers.

## Batch 2 — deployed and partially live-verified

- Cross-process advisory exclusion coordinates visitor turns and operator transitions. Synthetic overlapping-lock rejection and successful operator transitions passed; this is not a live load/concurrency certification.
- Explicit OWNER/ADMIN AI resume is audited. Historical human reply polling cannot undo that transition. A reset marker prevents old circuit-breaker evidence from immediately relocking a resumed turn. Completed sales-stage leads cannot misleadingly resume.
- Visitor capability is retained in sessionStorage for reload. Human reply polling uses timestamp plus ID cursors and preserves final reply pagination. Full visitor/AI transcript restoration and rendered-read acknowledgment remain unfinished.
- Durable notifications use the existing AutomationJob queue, three attempts, overdue escalation, handover-cycle idempotency, and visible retry/dead-letter status. Reconciliation pages beyond the first 250 requests. A stale worker lease cannot start sending; completion/failure is fenced by worker/attempt. SMTP delivery remains at-least-once: an acceptance followed by a process crash can still create an ambiguous retry; do not promise exactly-once email delivery.
- The operations API now applies trusted property/lead/actor values after untrusted payload fields, preventing request-body scope overrides.
- Core: **250/250**, no skipped cases; TypeScript passed. VPS focused handler/operator/notification/worker suite: **56/56**. Production staging build passed. These are synthetic engineering checks, not real-world accuracy.
- Deployment readiness: `2026-09-05T17:11:08.852Z`, public recheck `2026-09-05T17:13:56.945Z`, exact release matched. Rollback: `/var/backups/aifrogi/bucket2-batch2-20260905.Ar3erC`. No database migration or tenant reset.

### Email acceptance

One labelled test was sent to the explicitly approved recipient `info@webtechnosys.com` using the shared production handover template and mail sender. Earlier script attempts failed before SMTP (server-only import/runner setup); the accepted message was not resent.

- SMTP message ID: `<25b6a860-4bce-b808-07a7-dbc1b46415c8@aifrogi.com>`.
- User explicitly confirmed: **“mail received”** on 5 September 2026.
- This proves the test sender/template path reached the mailbox. It does not alone prove the scheduled queue's full request-to-email path or all notification recipients.

### Live browser evidence

Using the user's logged-in Webtechnosys Client Admin inbox, one clearly labelled synthetic request was created: `QA B2 acceptance 20260905`, lead `cmton4enk002g1kkxrux8m3y3`.

1. Visitor received truthful “saved / human has not joined yet” acknowledgment.
2. Client inbox displayed the exact labelled visitor message and one durable human-review item.
3. A labelled operator reply was sent only to this QA conversation.
4. Standalone visitor displayed that exact operator reply and **Business team replying · AI paused**.
5. A further visitor message received a saved-message acknowledgment, not competing AI advice.
6. After the user replied “yes or we can do later” to the scoped request, explicit Client Admin resume succeeded. Visitor polling displayed AI ready, and a new support-phone question returned the approved `+91-7410582898`. Historical human replies did not revert ownership.
7. A labelled final operator reply was saved to the same QA conversation. The subsequent close click was blocked by browser safety review requiring fresh explicit confirmation. Closure has NOT been executed or certified. No other conversations were changed.

### Review checkpoint and remaining work

Completed: deployed durable handover, consent boundaries, operator authorization, human-owned AI pause, explicit audited resume, real standalone operator delivery, notification retry controls, confirmed test email receipt, and rollback-protected deployment.

Remaining before Bucket 2 acceptance:

1. Close this QA conversation with explicit approval and verify the final reply remains accessible.
2. Verify embedded-widget delivery and reconnect without lost/duplicated transcript; add rendered-read acknowledgments and tenant-isolation regression coverage.
3. Prove partial-write/retry recovery and live visitor/operator concurrency. Queue-item idempotency does not yet certify every message retry.
4. Verify the scheduled notification and overdue-SLA path end to end; direct email receipt is not proof of the scheduler.
5. Fix observed operator UI refresh lag: immediately after resume the success notice was correct, but the side panel still displayed the previous handoff state/open-operation count until refresh.
6. Rerun and map every required B2-01–15 case. Do not advance to Bucket 3 on aggregate tests alone.

Do not close the 15-case manifest yet: embedded-surface delivery, complete reconnect transcript/read acknowledgment, partial-write retry recovery, supervised resume/closure, scheduled mail/SLA end-to-end and live concurrency remain to be completed. The deployed batch improves controls; it is not a numerical accuracy/readiness upgrade.

## Implemented in this batch

- Explicit human requests and governed escalations use one deterministic tenant/lead-scoped HUMAN_REVIEW item in the existing operations queue. Repeated requests do not recreate the item or reset its configured SLA deadline. No notification delivery is implied.
- Callback contact fields remain consent-gated. In-chat help does not require those fields.
- Disabled handover no longer advertises availability or promises a live connection.
- A conversation already owned by a human saves subsequent visitor messages without calling the model. Acknowledgments are transport receipts, not grounded AI answers.
- Website operator replies require an authenticated admin or active OWNER/ADMIN/AGENT in the correct workspace. VIEWER, inactive membership, foreign tenant and AI-sender impersonation are rejected.
- Operator reply, HUMAN_JOINED ownership, request assignment and audit event are transactionally saved. Closing writes audit evidence and completes matching open requests.
- Closed sessions reject new messages but retain read-only access to final replies until the existing capability expires. Revocation remains a separate denial of access.
- Empty reply polls use persisted ownership, not an old token's status. Closed state is returned with final replies rather than discarding them.
- The shared widget/standalone component now polls the existing human-reply endpoint, deduplicates rendered reply IDs, shows human/closed state and handles transient send errors. Existing website-close feedback text was corrected in the shared inbox component; WhatsApp transport was not changed.

## Evidence

- Local core: 231/231 passed, including 16 new Bucket 2 fixture tests. This includes the prior Bucket 1 cases, not an additional separate count.
- TypeScript passed; Bucket 1 manifest still 21/21.
- Fixture coverage: request, optional contact consent, repeated request/deadline, disabled handover, already-human-owned POST, queue outage, closed POST, empty poll, final closed reply; operator authentication, viewer/foreign tenant denial, assignment/reply audit, sender impersonation, close audit, reply-after-close rejection.
- The tests invoke real request handlers with infrastructure fixtures. They do not constitute real mail delivery, live multi-operator concurrency or visual widget acceptance.

## Required before full Bucket 2 closure

1. **Concurrency and retries:** test operator takeover while a model call is already in flight; concurrent first submissions; retry after a partial persistence failure. Current per-conversation queue identity prevents duplicate queue items, not every possible duplicate chat message or operator reply.
2. **Visitor reconnect and polling:** preserve/recover the visitor session appropriately, verify both surfaces in browser, paginated/tied-timestamp replies, rendered delivery/read acknowledgments (B2-08–10). Basic polling is implemented; full reconnect certification is not.
3. **Controlled handover lifecycle:** explicit authorised reopen/resume-AI path, assignment permissions and operator experience. No implicit return to AI is added by this batch.
4. **Notifications:** existing mail integration, bounded retries, delivery status, failure visibility and a coordinated test recipient (B2-12/13).
5. **SLA:** queue deadline is set from configured minutes, but overdue notification/escalation and unassigned-request handling require end-to-end verification (B2-14).
6. **Live acceptance:** labelled request → permitted operator → visitor receipt → final reply/closure, then run the complete 15-case manifest. No full Bucket 2 acceptance or numerical rating is claimed yet.

No schema migration, business-fact approval, booking/payment action, or destructive tenant action is required for this batch.

## Deployment evidence

- VPS focused handler/operator tests: 37/37 (21 existing Bucket 1 + 16 Bucket 2). Production build passed.
- Readiness passed at `2026-09-05T13:10:53Z`; public readiness returned the exact release.
- Standalone and embed pages returned HTTP 200; unauthenticated operator POST returned 401.
- Rollback build and changed existing sources: `/var/backups/aifrogi/bucket2-batch1-20260905.g5FDGO`; prior release `bucket1-accepted-20260905`.
- No supervised live operator reply or actual notification receipt is claimed. Production smoke intentionally avoids creating a support queue request.
