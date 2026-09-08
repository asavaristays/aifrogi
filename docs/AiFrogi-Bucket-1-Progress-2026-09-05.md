# Bucket 1 — shared runtime correction batch 1

Status: Bucket 1 acceptance completed on 5 September 2026. See `AiFrogi-Bucket-1-Acceptance-2026-09-05.md` for the closure evidence and scope. Earlier entries below preserve their original open status as history.

## Confirmed defects and corrections

- Shared circuit-breaker replies named Webtechnosys in every tenant. Replaced with neutral business-team wording; removed unsupported claims that assistance had already been requested.
- Repeating a formerly unresolved question could escalate even when a valid answer became available. Customer-repeat escalation now requires an unresolved outcome.
- Fingerprinting discarded non-Latin text and collapsed all URLs. Unicode letters/numbers and URL content now survive normalization.
- Context resolution excluded earlier contact questions. It now selects the latest business or contact question and excludes unrelated weather turns.

These are shared corrections, not changes to tenant-approved facts. No WhatsApp configuration or transport was changed; shared utilities may also be consumed by other channels.

## Evidence

- Local core suite: 184/184, including five new focused regressions; TypeScript passed.
- VPS production build passed. Release: `bucket1-runtime-20260905`; runtime health passed.
- Public Webtechnosys browser smoke: phone answered correctly; weather refused; contextual return answered the original phone question correctly. This was an agent-generated three-turn production test, not organic customer traffic or a statistical accuracy sample.
- Rollback build/source: `/var/backups/aifrogi/bucket1-20260905.WUHZtT`.

## Still required before Bucket 1 closure

- Isolated runtime/HTTP tests for repeated fallback, persistent circuit lock, known-slot reuse, topic changes and recovery beyond the one live journey.
- Approved/expired/flagged/conflicting retrieval tests through runtime paths, not only helpers.
- Per-case decision/evidence integrity review and suite completeness report.
- Broader persona-specific live verification belongs to Bucket 3; no claim that all eight personas are end-to-end certified.

Do not move to Bucket 2 or issue an 8.5/95% certification from this batch alone.

## Follow-up correction deployed — 5 September 2026

- Release: `affirmative-context-20260905`; deployed after explicit VPS upload/deployment approval.
- Short affirmative replies use the last assistant offer from the authenticated tenant visitor session. An offered URL is rechecked against selected PUBLISHED claims before deterministic reuse; the assistant's earlier text alone is not authority.
- No booking, payment or callback authority is granted by this informational continuation.
- Local core suite: 194/194; TypeScript passed. VPS focused regressions: 15/15. Production build passed.
- Public readiness returned HTTP 200 with the exact release at 11:50 UTC.
- Synthetic public HTTP smoke: training question returned a booking offer; subsequent `yes` returned `https://webtechnosys.com/training-booking/`, decision ANSWER, state RESOLVED, no circuit breaker. Response explicitly stated that no booking or payment had occurred.
- This smoke created test conversation evidence, not organic customer accuracy evidence. No approved business facts, database schema or WhatsApp configuration were changed.
- Rollback copy: `/var/backups/aifrogi/affirmative-context-20260905.8TVGvN`.

The full Bucket 1 acceptance items above remain open; this deployment closes the reported affirmative-follow-up defect, not the entire bucket.
