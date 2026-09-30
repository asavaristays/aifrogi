# Stage Implementation Report

**Stage:** Compatible knowledge and bot rollback (`KRL-05`)  
**Date:** 2026-09-30  
**Outcome:** PASS

## Architecture status after this stage

- **41 of 74 controls WORKING FINE — 55%**
- **17 NEEDS ATTENTION — 23%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 10%**

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| KRL-05 | NEEDS ATTENTION | WORKING FINE in isolated PostgreSQL rollback scope | `20260930005000_compatible_knowledge_rollback`; `scripts/verify-compatible-knowledge-rollback.sql` |

## Implementation completed

- Added a dedicated rollback routine; normal activation remains unable to activate superseded releases.
- Rollback requires a separately granted `KNOWLEDGE_ROLLBACK` publisher purpose.
- Revalidates the exact approval, manifest membership, source state, current consent window/scope/audience, structured-source digest, captured bytes, and usable object state.
- Binds the target knowledge hash to the target signed bot release and machine policy.
- Requires exact deployed build, database schema, serving contract, retrieval version and website adapter version compatibility.
- Advances knowledge and bot pointers with independent compare-and-set generations in one transaction.
- Restores the matching machine policy and release states atomically.
- Direct website, public and worker execution remains revoked.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| Migration on `p2b_rehearsal_rollback3_20260930` | PASS | Routine and least-privilege grant applied transactionally |
| Incompatible runtime identity | PASS | Rejected with `ROLLBACK_RUNTIME_INCOMPATIBLE` |
| Revoked present consent | PASS | Rejected with `ROLLBACK_MIXED_SOURCE_INCOMPATIBLE` inside a rollback-only test transaction |
| Compatible mixed-source rollback | PASS | Knowledge generation advanced 2→3 and bot generation 3→4 to the exactly bound prior releases |
| Stale bot pointer | PASS | Rejected with `BOT_RELEASE_POINTER_STALE`; the preceding knowledge-pointer update was rolled back atomically |
| Direct website-role execution | PASS | No execute privilege on rollback routine |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run verify:p2b:app` | PASS 14/14 | Signed policy/release and serving controls remained green |
| Production edge-closed rollback | NOT RUN | Remains tracked separately by APP-08 |

SHA-256:

- `011df8d74ff35a864d442db245435f2f251a9f818a56eb1ac123eb1349165272` — migration SQL
- `3f8cc9bf2d99d278a5bbe9e417fbb4d5feab2de01edfcdc120ba392843326cc8` — behavioral fixture

## Remaining P0

1. `APP-05`: repair and prove canonical empty/restored bootstrap ordering.
2. `APP-08`: execute an edge-closed rollback drill for the exact reconciled release.

## Honest boundary

This stage proves database rollback enforcement on disposable PostgreSQL. It does not claim a production rollback, nginx edge closure, restored-production compatibility, or deployment approval.
