# Bucket 1 acceptance — 5 September 2026

Status: **Accepted for the shared website-runtime scope. Bucket 2 may begin.**

This closes the specific acceptance work listed in `AiFrogi-Bucket-1-Progress-2026-09-05.md`. It is not an enterprise certification, an all-persona certification, or evidence of 95% real-world accuracy.

## Evidence and completeness

| Evidence | Result | Meaning |
| --- | --- | --- |
| Local core suite | 215/215; no failures/skips | Includes the 21 new acceptance cases; do not add the two counts together |
| TypeScript | Passed | Local type check; VPS production build also passed |
| Closed acceptance manifest | 21 required / 21 executed / 21 passed locally and on VPS staging | Missing, duplicate, unexpected, skipped or failing cases withhold acceptance |
| Actual HTTP-handler isolation | Passed | Real POST handler, knowledge service/repository, signed sessions, resolution, output validation and evidence repository; database, model transport and unrelated infrastructure adapters use synthetic fixtures |
| Post-deployment live smoke | 10/10 turns across two synthetic sessions | Live HTTPS, real model/database, Webtechnosys only; each response returned an evidence ID |
| Readiness | HTTP 200; exact release confirmed | Database and configured health checks passed |

Commands: `npm run test:core`, `npm run typecheck`, `node scripts/verify-bucket-one-acceptance.mjs`. The live smoke is explicitly opt-in: `RUN_AIFROGI_LIVE_SMOKE=1 node scripts/smoke-bucket-one-live.mjs`.

Artifacts: `output/acceptance/bucket-one-http.json`, `bucket-one-http.tap`, `bucket-one-live.json`. They identify synthetic evidence explicitly. The fixture matrix invokes the real HTTP handler with Request/Response objects; it is not a deployed network/database fault-injection test.

## Acceptance mapping

| Case IDs | Required behaviour | Result |
| --- | --- | --- |
| B1-01, B1-14 | Approved offer continuation; revalidate link after pause | Passed |
| B1-02-PAUSED/EXPIRED/CONFLICT/FLAGGED, B1-03/04/13 | Publication boundary, expiry and disputed-knowledge suppression | Passed |
| B1-05/12/18 | Tenant-filtered retrieval, invalid/revoked visitor rejection | Passed |
| B1-06/07/08/09/15 | Interruption return, persistent bounded exit, consented-slot retention, new-topic recovery, ambiguous yes | Passed |
| B1-10/17 | Discarded-answer evidence removed; evidence-write outage returns 503 | Passed |
| B1-11/16 | Unapproved URL and invented transaction confirmation withheld | Passed |

Each successful fixture response is compared with its actual evidence-repository output for answer text, disposition, grounding and decision/behaviour consistency. No tested-case mismatches remained. This is a bounded regression assertion, not a universal semantic correctness claim.

## Defects found and fixed

1. Legacy `APPROVED` claims were retrievable before publication. Retrieval now requires `PUBLISHED`; expiry/conflict checks remain active. No facts were auto-approved or migrated.
2. A bounded-resolution replacement could retain the discarded model answer's grounding/used-claim metadata. Replacement replies now clear sources and used claims, retain retrieval candidates for diagnosis, and record conversation-state failure metadata.
3. “Please restate” was incorrectly classified as an answer by the evidence-consistency detector. It now recognises that clarification wording.
4. Failure to write evidence could still return HTTP 200 and an untraceable answer. It now returns HTTP 503 without delivering that answer. The earlier conversation capture may already exist; this is not a claim of transactional rollback of every write.

All four are shared-runtime corrections, not Webtechnosys-only business rules. WhatsApp configuration and transport were not changed. Shared utilities may also have other consumers.

## Deployment and rollback

- Release: `bucket1-accepted-20260905`.
- Production readiness confirmed at `2026-09-05T12:01:40Z`.
- VPS: `187.77.188.146`; application `/var/www/lead-os-ai`.
- Rollback build and changed sources: `/var/backups/aifrogi/bucket1-accepted-20260905.8cOgq9`.
- Prior release: `affirmative-context-20260905`.
- No schema migration, tenant reset, business-fact modification, booking, payment or feedback vote occurred. The live smoke created ten synthetic conversation/evidence records.

## Scope carried forward, not silently certified

- Bucket 2: real human-handover consent, assignment, notification delivery/failure, business reply, closure and SLA. The bot's offers to connect a human must be checked against that actual workflow.
- Bucket 3: all eight persona-specific normal/adversarial journeys. Only Webtechnosys was tested live here.
- Bucket 4: provider connector authorisation, idempotency, read-back, outages and revocation.
- Bucket 5: private human pilot and reviewed real-client outcomes; calibration of unnecessary escalation, retrieval precision/recall and accuracy. Synthetic passes cannot establish customer accuracy or justify a numerical readiness rating.

Reopen Bucket 1 for a reproduced shared-runtime regression, cross-tenant exposure, false transaction confirmation, unsafe knowledge reuse, persistent clarification loop, or missing/mismatched answer evidence. Do not delete tenants as a debugging step.
