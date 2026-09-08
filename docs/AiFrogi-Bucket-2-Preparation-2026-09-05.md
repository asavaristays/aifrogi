# Bucket 2 — human handover preparation

Status: Plan only. No runtime changes or deployment in this preparation session.
Prerequisite: Bucket 1 accepted; release `bucket1-accepted-20260905`.
Scope: Website widget and standalone bot only. WhatsApp, cosmetic redesign and new connector work deferred.

## Outcome

A visitor can request a human, the correct business sees one actionable request, a permitted operator replies, the visitor receives it, and closure is recorded. Nobody is told a human was notified or joined unless that event actually occurred.

## Existing foundation — inspected, not certified

`app/api/public/website-bot/[slug]/route.ts` already contains signed visitor sessions, consented contact persistence, HUMAN_REQUESTED state, agent-message polling and delivery/read acknowledgments. These should be tested and repaired, not rebuilt wholesale.

Priority inspection findings:

- Response currently always exposes `handoffAvailable: true`; verify it respects configuration and real availability.
- POST can still generate AI replies while a human owns the conversation; establish and test ownership.
- GET derives state partly from the token and current message batch; verify a HUMAN_JOINED session does not regress when no new messages arrive.
- GET returns CLOSED before returning messages for a closed lead; check whether an operator's final reply becomes invisible when closure follows immediately.
- Assignment, outbound notification/retry and SLA enforcement have not been verified by this limited inspection. Do not describe them as absent or complete without tracing their existing implementations.

## Execution order — small, evidence-backed batches

| Batch | Work | Required proof |
| --- | --- | --- |
| 2A — Ownership and request | Consent; durable request; duplicate protection; correct tenant queue; AI/human ownership; truthful status | B2-01–06 |
| 2B — Operator reply and closure | Authorised assignment/reply; widget/link delivery; reconnect; read acknowledgment; final reply before closure | B2-07–11 |
| 2C — Notifications and overdue requests | Existing mail mechanism first; bounded retry; visible delivery failure; configured SLA and overdue escalation | B2-12–15 |

Complete tests and deploy each verified batch with rollback. Do not mark Bucket 2 complete after 2A alone. Reuse the Bucket 1 isolated-handler harness and existing inbox/support mechanisms; add no new ticket system unless a confirmed gap requires it.

## Fixed acceptance manifest — 15 cases

1. **B2-01:** Explicit human request creates one durable tenant-scoped request and acknowledgment.
2. **B2-02:** No contact consent means no stored callback details; in-chat help remains possible.
3. **B2-03:** Repeated submission/retry does not duplicate requests or notifications.
4. **B2-04:** Disabled or unstaffed handover gives truthful asynchronous expectations, not “connected.”
5. **B2-05:** Another tenant/unauthorised operator cannot see, assign or reply to the request.
6. **B2-06:** Once a human takes ownership, AI does not compete; only an explicit controlled transition resumes AI.
7. **B2-07:** Client operator receives correct conversation context and can assign/reply.
8. **B2-08:** Reply reaches the correct visitor on widget and standalone surfaces.
9. **B2-09:** Empty polls/reconnect do not lose messages, repeat them, or regress human ownership state.
10. **B2-10:** Delivery/read acknowledgments cannot modify another visitor's messages.
11. **B2-11:** Final human reply remains available when the request closes; close/reopen is auditable.
12. **B2-12:** Valid notification reaches the intended test mailbox; provider acceptance and confirmed receipt are distinguished.
13. **B2-13:** Mail failure leaves the request visible, retries are bounded, and no false delivery success is recorded.
14. **B2-14:** Missing assignee/overdue request surfaces to the responsible team using the configured SLA; no invented promise.
15. **B2-15:** Persistence outage fails safely without a false acknowledgment; recovery does not duplicate requests.

Gate: 15 required, no missing/skipped cases; critical failures block closure. Record exact expected outcomes before implementation. Retain per-case evidence, not just aggregate counts.

## Responsibilities and defaults

- Client owner/admin: customer enquiries and business answers.
- AiFrogi operations: unassigned/overdue requests and operational failures, not automatic ownership of every customer question.
- Engineering: platform defects and repeated delivery failures.
- Preserve existing configured SLA; do not introduce a new customer-facing response guarantee.
- Visitor contact details are optional for in-chat support; explicit consent is required for saved callback contact details.
- Do not send real-client test notifications or modify their knowledge. Use isolated fixtures first; coordinate one labelled live test with a permitted operator/test recipient at final verification.

## Closure evidence

15-case manifest, core regression pass, role-isolation proof, controlled live request → operator reply → receipt → closure, mail success/failure evidence, exact deployed release and rollback location. Carry unresolved external requirements explicitly. No accuracy rating increase from handover tests alone.

Next session start: inspect the existing operator reply/assignment and mail/SLA paths, then run 2A failing fixtures before changing code.
