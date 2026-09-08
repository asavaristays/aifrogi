# Bucket 3 B1 acceptance — 6 September 2026

## Scope and evidence

BusinessGPT, HotelGPT, ClinicGPT and DineGPT: 40/40 isolated HTTP journeys pass. Full local core regression: 301/301; TypeScript check passes.

The real public HTTP handler, retrieval, governance, signed sessions, evidence consistency and demo connector resolver execute. Database and model infrastructure are deterministic test adapters. No client knowledge was changed, no external connector was called and no customer email was sent. This is not a production accuracy percentage or live connector certification.

## Found and corrected

First knowledge slice: 20/24 passed. All four topic-return cases failed because business-intent matching omitted plural services, rooms, treatments and cuisine. Added these terms to the shared routing vocabulary. Knowledge approval and action authority remain independently enforced. Re-run: 24/24; completed connector/safety slice: 16/16.

## Case-bank clarification

Connector failures use explicit offline requests with every required demo slot supplied. DineGPT's original fixture failure prompt was an allergen question, not an outage; it cannot prove connector handling. The executable test records the replacement outage prompts. These tests assert a SAFE_FAILURE event and performed=false, not simply an escalated answer.

Authority tests cover unsupported requests without approved claims; they do not exhaust maliciously approved data, all adversarial paraphrases or real provider responses. Affirmative cases verify safe clarification when no offer exists; existing Bucket 1 tests cover approved-offer continuation. Loop tests check the final locked circuit breaker and zero connector events.

## Remaining

- B2: eduGPT, PropertyGPT, FlowCart and Custom Bot — remaining 40 journeys.
- Part C: combined acceptance, additional adversarial/real-provider evidence and final release review.
- Real-client outcome sampling is still required for a 95% accuracy claim.

## Verified deployment

- Release: `bucket3-b1-20260906`; VPS staged focused tests: 75/75; production build passed.
- Readiness verified at `2026-09-05T18:39:08.718Z` (6 September IST).
- Rollback backup: `/var/backups/aifrogi/bucket3-b1-20260906.NvYmwx`.
- Only runtime source changed: `lib/sovereign-intelligence/decision.ts`. No schema migration or client data reset.
- Synthetic production smoke: services ANSWER → weather REFUSE → earlier-question ANSWER, 3/3. Evidence IDs: `cmtoq8xds001xfokx3um9wqir`, `cmtoq8xij0029fokx8u4mkevq`, `cmtoq8yte002lfokxa2atpb0z`.
- These three synthetic chat/evidence records remain labelled by a `qa-b3-b1-` session; they are not real-client outcome samples.
