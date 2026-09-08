# Bucket 3 — final acceptance, 6 September 2026

Status: **A/B/C complete for the defined synthetic, controlled-pilot persona scope.** No unresolved failure in the required bank. This is not universal reliability, real-client accuracy, live connector certification or an unrestricted commercial launch approval.

## Evidence gates

| Gate | Result | Evidence |
| --- | --- | --- |
| Eight-persona journey completeness | 80 required, 80 executed, 80 passed; no duplicates, missing or skipped cases | `output/acceptance/bucket-three-http.json` and `.tap`; regenerated locally and on VPS staging |
| Per persona | BusinessGPT, HotelGPT, ClinicGPT, DineGPT, eduGPT, PropertyGPT, FlowCart, Custom: 10/10 each | Same closed manifest |
| Prior Bucket 1 completeness | 21/21 accepted | `output/acceptance/bucket-one-http.json` |
| Prior Bucket 1/2 regression on VPS staging | 58/58 | `/tmp/b3-c-prior.tap` on VPS; temporary log, rerunnable |
| Full local core | 341/341, zero skipped | `npm run test:core` |
| TypeScript | Pass | `npm run typecheck` |
| VPS production build | Pass during B2 release | B2 acceptance report |
| Exact deployed release | `bucket3-b2-20260906`, healthy | Readiness rechecked `2026-09-05T19:49:10.830Z` UTC |
| Source identity | Local and production SHA-256 match | decision.ts: `8d0099fb4bf4282529a9a25fcdc3a46992f5b3fc8a398a056faa9405d21ea580` |
| Live reference smoke | 3/3 on this same release | B2 report: training URL → weather refusal → topic return with approved training URL |
| Rollback | Previous build confirmed present | `/var/backups/aifrogi/bucket3-b2-20260906.WS3gge/next/BUILD_ID` |

Part C added `scripts/verify-bucket-three-acceptance.mjs`: a fail-closed completeness check producing a durable per-persona matrix and raw TAP. It withholds acceptance for missing, duplicate, failed or skipped cases. No runtime changed in Part C, so the verified B2 build remains live; no redundant restart or migration was performed.

## Review of test strength

Real HTTP handling, retrieval, governance, signed sessions and evidence assertions execute against deterministic model/database infrastructure. Mock connector failures assert SAFE_FAILURE and performed=false. Evidence decisions must match responses on each successful non-transport turn. This does not measure unconstrained LLM accuracy.

Known limits are explicit: authority tests do not exhaust adversarial approved data; the paraphrase case retains original wording; yes cases primarily exercise no-offer clarification (supported-offer coverage also exists in Bucket 1); loops test final locked state; category safety rules remain lexical and English-oriented. Stronger paraphrase, multilingual and adversarial testing remains future hardening, not evidence silently credited here. Custom remains a governed scaffold, not certification of arbitrary customer workflows.

No client facts, approvals, connector configuration or tenant records were reset. Earlier labelled live smoke adds synthetic chat/evidence only. Do not include synthetic tests in real-client accuracy reports.

## Handoff

1. Bucket 4: certify each required real connector with tenant isolation, minimum permissions, explicit write consent, idempotency, read-back and truthful failure handling. No connector credential installation or real action is authorised by this report alone.
2. Bucket 5: reviewed client conversations, persona-level safe resolution, false confidence/caution, feedback correction and accuracy measurement.
3. Pilot onboarding still requires each client's own approved knowledge and launch gates. Passing this bank cannot bypass them.

If a regression occurs, use the retained application rollback under the existing deployment policy; do not delete tenant knowledge or run destructive schema rollback. References: B1/B2 acceptance reports and Bucket 3 ABC plan.
