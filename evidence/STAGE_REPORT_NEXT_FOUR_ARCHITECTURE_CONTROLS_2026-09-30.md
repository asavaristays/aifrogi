# Stage Implementation Report

**Stage:** ADM-03, HND-04, SRC-04 and SRC-05  
**Date:** 2026-09-30  
**Outcome:** PASS in the scopes stated below

## Architecture status after this stage

- **46 of 74 controls WORKING FINE — 62%**
- **12 NEEDS ATTENTION — 16%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 10%**

Percentages are rounded; counts are authoritative and total 74.

## Status changes

| Control | Before | After | Enforcement and evidence |
|---|---|---|---|
| ADM-03 | NEEDS ATTENTION | WORKING FINE in disposable PostgreSQL and website-route scope | Platform-authority routine with expected-version CAS, required incident/reason, forced RLS, append-only events, least privilege and a pre-answer website-route gate |
| HND-04 | NEEDS ATTENTION | WORKING FINE for website wording | Profile SLA is no longer emitted as a public promise; time-specific wording requires an explicit approved signed-policy artifact identity |
| SRC-04 | NEEDS ATTENTION | WORKING FINE in deterministic adapter tests | PDF bytes, identity, ordered page extraction digests and manifest digest are immutable and deterministic |
| SRC-05 | NEEDS ATTENTION | WORKING FINE in deterministic adapter tests | Spreadsheet bytes and manifest are versioned; each row binds sheet, physical row number, stable key and canonical row digest; missing/duplicate keys fail closed |

## Implementation

- Added migration `20260930006500_per_bot_factual_closure` and matching Prisma models.
- Added the Super Admin close/reopen actions and the public website bot fail-closed check.
- Added `lib/canonical-file-ingestion.ts` for deterministic PDF and spreadsheet source-version manifests.
- Changed public handover wording so an unsigned profile target cannot become a customer promise.
- Added the new migration to the atomic disposable bootstrap.
- Corrected bootstrap input preflight so workspace paths containing spaces remain a single path.

## Verification results

| Gate | Result | Observed evidence |
|---|---|---|
| Fresh atomic bootstrap on `p2b_rehearsal_next4_20260930` | PASS | Baseline plus every canonical migration, including the new control, committed successfully |
| ADM-03 adversarial SQL fixture | PASS | `PER_BOT_FACTUAL_CLOSURE_PASS`; stale CAS and missing justification rejected; unrelated bot remained open; reopen succeeded |
| ADM-03 catalog check | PASS | 2/2 new tables forced RLS, 2 policies, 2 append-only events, final version 2 |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run verify:p2b:app` | PASS 18/18 | Includes closure route/order, least privilege, PDF versioning and spreadsheet provenance |
| Website lifecycle/security focused suite | PASS 34/34 | Includes neutral and explicitly authorized SLA wording |
| Prisma schema validation | PASS | Schema valid and client regenerated |
| Shell syntax | PASS | `scripts/p2b-bootstrap-disposable.sh` |
| Production deployment | NOT RUN | No production mutation was performed |

## Pinned hashes

- `5e8990f3305921b98a3e2abb09db6ca28f4a222f84abbef4347a06725dca52ab` — closure migration
- `7fb43a9dbd4428dbedf48358630d4897c03ea3caae4dffb841e35a2fd41cb52a` — closure application boundary
- `fc896dde9efa765d6a3415e9485f9ced3d0cff8a54cb8ac8d3d01887bd251bc3` — handover wording authority
- `3cbdde96284fe32b7e8d3c66e468760e355b769c9f95948159198ac61e09f8c4` — canonical file ingestion
- `5c2c8711b79a5c8d62f55e5b241d2d8dcf8698090aac48dac4fb209e21e98a13` — closure SQL fixture
- `ded0c5517cdd9fc1d5d73ce916d90fb099a34259dc895d61fcf82cfaac9f0bef` — atomic bootstrap

## Honest boundary

These results close the four controls only in their named disposable/application-test scopes. They do not prove production migration, production traffic, real PDF/workbook upload journeys, non-website adapters, restored-production compatibility, or fleet capacity. Those remain governed by their existing controls and statuses.
