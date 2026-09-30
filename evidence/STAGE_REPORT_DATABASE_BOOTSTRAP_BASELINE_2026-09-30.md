# Stage Implementation Report

**Stage:** Reproducible database bootstrap and restore baseline (`APP-05`)  
**Date:** 2026-09-30  
**Outcome:** PASS

## Architecture status after this stage

- **42 of 74 controls WORKING FINE — 57%**
- **16 NEEDS ATTENTION — 22%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 9%**

Percentages are rounded to whole numbers; counts are authoritative and total 74.

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| APP-05 | NEEDS ATTENTION | WORKING FINE for the pinned disposable empty/restore baseline | `scripts/p2b-bootstrap-disposable.sh`; empty, forced-failure, rerun-refusal and dump/restore results below |

## Implementation completed

- Added a readable-input preflight for every baseline and migration file, preventing `psql` from silently skipping a missing `-f` input.
- Added a strict empty-target preflight; rerunning against a populated database exits 65 before mutation.
- Combined runtime roles, baseline and every canonical migration into one PostgreSQL transaction.
- Added the retention-disposal and compatible-rollback migrations to the canonical bootstrap order.
- Kept `prisma db push` out of the procedure.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| Empty bootstrap: `p2b_rehearsal_bootstrap2_20260930` | PASS | 119 public tables, 55 forced-RLS relations, 55 policies, 64 `aifrogi_security` functions |
| Historical `is_session_active(text)` ordering point | PASS | Complete current migration ran through helper creation and final grants without error |
| Missing input discovery | FAILED safely after the issue was identified | First candidate checkout lacked migration files; this exposed that client-side missing `-f` input was not a transactional SQL error. The final preflight now blocks before SQL starts. The affected disposable database is not release evidence. |
| Deliberate SQL failure: `p2b_rehearsal_bootstrap_failure_20260930` | PASS | Command failed with status 1 and left `remaining_relations=0` |
| Non-empty rerun | PASS | Bootstrap refused with status 65 and `refusing non-empty bootstrap target` |
| Dump and isolated restore: `p2b_rehearsal_bootstrap_restore_20260930` | PASS | Restored catalog counts exactly matched the source |
| Source/restored schema parity | PASS | Both schema-only exports produced SHA-256 `eb91f2b2f9c087c6d20b0e59fd995e3f25564effbb32f5d5d311afe77bc9a40b` |
| `sh -n scripts/p2b-bootstrap-disposable.sh` | PASS | Shell syntax valid |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run verify:p2b:app` | PASS 14/14 | Canonical application controls remained green |
| Restored production-backup migration/catalog comparison | NOT RUN | Tracked separately by APP-07 |
| Production | NOT RUN | No production action was taken |

## Pinned input hashes

- `0c577afbd7af3f76ac0c8edf93e8055207503c7ca2ce10ab0c283d7da6b47398` — bootstrap script
- `857b511a0ab12189ba5eee5789e123ab273b92900550b44941a92e64cf97cee1` — runtime roles
- `a149e4008efae6e39012183f6c3ca41978a0458080b74317c62752fb4c028e58` — baseline
- `35c1182fcc45c56867980f63028537962e13193e05a66c16ec509efdfe8b2496` — canonical authority migration
- `595214bb59483b1a0f3f8c4854ffd2f953b8ab03dad3593ad4565dd950c1e59a` — signed bot release migration
- `2dfcb22228509b251c03985ebbf1dec28b14dc432d519793cb51bba736bb8bf6` — multi-source release migration
- `b6418edef3a30f9cb12e80dd102347651c70ccd937fd682e8a0122e9cbb32356` — retention-disposal migration
- `011df8d74ff35a864d442db245435f2f251a9f818a56eb1ac123eb1349165272` — compatible rollback migration

## Remaining P0

1. `APP-07`: run the exact release against an isolated restore of the approved production backup and compare security catalogs.
2. `APP-08`: perform the edge-closed rollback drill for that restored release.

## Honest boundary

This closes the reproducible empty/disposable restore baseline only. It does not prove migration of the actual production backup, production grants/catalog parity, edge behavior, deployment approval or production readiness.
