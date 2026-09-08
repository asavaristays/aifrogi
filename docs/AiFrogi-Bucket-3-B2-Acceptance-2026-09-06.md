# Bucket 3 B2 — 6 September 2026

## Verified local results

eduGPT, PropertyGPT, FlowCart and Custom Bot: 40/40 isolated HTTP journeys passed. Combined B1/B2: 80/80. Full core suite: 341/341; TypeScript passes.

First B2 run: 37/40. Topic return failed for programmes, properties and workflow. Shared intent vocabulary now recognises those terms, including program/programme variants. This routes retrieval only; it does not grant knowledge approval or connector write authority.

## What the evidence proves

Actual HTTP handler, retrieval, signed sessions, resolution, evidence consistency and demo connector resolver run with deterministic model and database adapters. Each category checks approved answers, phrasing, yes without an offer, off-topic return, missing slots, loop exit, deduplicated human request, connector outage, unsupported authority and tenant isolation.

Outage cases deliberately supply all required slots and request an offline connector. They assert one SAFE_FAILURE event, correct sandbox and performed=false. Older fixture failure prompts describe other safety failures and are not counted as outage evidence.

## Limitations and next gate

80/80 is a synthetic journey matrix, not 95% real-world accuracy. Authority cases use missing approved knowledge, not exhaustive adversarial approved-content tests. No real connector credentials, provider calls, emails or customer knowledge changes are involved in these isolated checks. Part C remains open for final acceptance, stronger adversarial checks and documented operational limitations. Real-client accuracy needs reviewed outcome samples.

## Verified deployment

- Release `bucket3-b2-20260906`; production build and staged80/80 pass.
- Readiness: `2026-09-05T19:47:07.740Z` (6 September IST).
- Backup: `/var/backups/aifrogi/bucket3-b2-20260906.WS3gge`; prior release `bucket3-b1-20260906` retained for rollback.
- Only changed runtime source: `lib/sovereign-intelligence/decision.ts`; no migration.
- Live synthetic regression3/3: approved training-booking URL, weather refusal, return to earlier topic with exact approved URL. Evidence: `cmtosoamq000dzkkxyfordz52`, `cmtosoaq3000pzkkx3b0mh06s`, `cmtosocfg0011zkkxwcdbuejo`.
- These are synthetic production records, not real customer outcome samples. The live smoke verifies the existing reference tenant, not four newly provisioned production personas.
