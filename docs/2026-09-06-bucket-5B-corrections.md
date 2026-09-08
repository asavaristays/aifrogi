# Bucket 5B — governed correction acceptance

Scope: harden the existing client-owned correction lifecycle. No autonomous rewriting, no approval of real client facts by QA, no WhatsApp changes.

Status: **CLOSED for the defined correction-publication safeguard scope**, deployed as `bucket5b-corrections-20260906`. This does not certify autonomous learning, every possible correction journey, or commercial accuracy.

Implemented: workspace authorization, gap closure only on publication, current-preview/state/flag/validity checks, serializable draft creation/preview generation/publication, explicit prior-version supersession, retained published history and rejection of superseded-version reconfirmation.

Acceptance required before closure: local regression, synthetic database lifecycle (draft, field approval, preview, regression, versioned publish, pause and supersession), tenant rejection, stale/paused preview rejection, retained history, audited publication, build/deployment and post-deployment health. Existing client Improve My Bot/Knowledge UI remains the owner-facing workflow; Super Admin assesses evidence in 5A but does not automatically approve client truth.

## Evidence — 6 September 2026

- TypeScript passed; full local core **420/420 passed**, including 12 correction publication-state tests.
- Staging build passed; **16/16 rollback-only database lifecycle checks** and existing **17/17 authenticated HTTP regression checks** passed before deployment.
- Deployed at `2026-09-06T02:04:40.619Z`; public health ok at `2026-09-06T02:04:57.596Z`.
- All three deployed source files matched staging by SHA-256 before post-deployment tests.
- Post-deployment **16/16 database lifecycle checks** passed again; marker `QA-5B-89fb1f01-e2d4-4cdf-b8b2-a3a93161521c`. All correction fixtures rolled back, leaving zero test claims/gaps and no real knowledge changes.
- Post-deployment **17/17 live authenticated measurement/feedback checks** passed; tag `QA-5A-837262f4-039e-4afa-ab6d-6ddba0c7f899`. Synthetic demo evidence retained: `cmtp65sf5000d3gkx0v4fcfoe`, `cmtp65t0c000u3gkx101uji0m`; temporary QA staff sessions revoked. Both runners exited 0.
- Rollback: `/var/backups/aifrogi/bucket5b-corrections-20260906.5ApaVB`. No schema migration.

## Correction lifecycle verified

1. Foreign gap cannot attach to a correction.
2. Draft leaves gap open.
3. Preview requires field approval.
4. Foreign tenant field approval rejected.
5. Changed-answer stale preview rejected.
6. Paused preview rejected.
7. New preview invalidates old pending preview.
8. Publication resolves the linked gap only after approval/regression.
9. Publication stores actor and regression audit evidence.
10. Conflicting replacement pauses earlier published truth.
11. Conflict requires explicit supersession.
12. Self-supersession rejected.
13. Replacement is the only published version; prior version retained.
14. Reconfirmation cannot revive superseded truth.
15. Paused published history cannot be deleted.
16. All synthetic fixtures rolled back.

## Client workflow

Client **Improve My Bot → knowledge correction → confirm fact → generate preview → approve**. Existing conflict workflow requires selecting the earlier version explicitly. The server reruns publication checks and records the approved replacement. If a correction is wrong, pause it immediately; restore content through a newly reviewed version, never by silently resurrecting superseded history. Super Admin uses 5A reporting to inspect outcomes; it does not auto-publish client facts.

## Evidence limits and follow-up

The 16-case lifecycle suite invokes repository functions in a shared rollback-only serializable DB transaction, with nested transaction calls scoped to it. It verifies actual DB state/constraints but does **not** prove independent concurrent transactions, browser button interactions or a committed real-client correction. The 17 live HTTP cases cover the existing 5A measurement/feedback endpoints, not a live publication of client knowledge. Claim-level pause is tested; no destructive database rollback is used.

The initial deployment wrapper failed to resolve a dependency before any deployment. Its module import was corrected; the successful build, tests and deployment followed. No production rollback was needed.

Next **5C**: private human pilot, reviewer-confirmed origin and correctness, actual owner-approved corrections, monitoring and real conversation evidence. Independent concurrency/load testing and automated historical replay remain separate extensions, not implied completed by these tests. Bucket 4 connector hardening remains separately open.

Not an accuracy certification. Full human-reviewed real conversations and live outcome measurement remain 5C. Existing publication gate checks atomic content and the Common suite; it is not an LLM replay of every historical customer conversation.
