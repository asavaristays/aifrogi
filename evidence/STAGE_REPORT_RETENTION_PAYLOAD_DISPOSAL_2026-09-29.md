# Stage Implementation Report

**Stage:** Retention and payload disposal (`SRC-09`)  
**Date:** 2026-09-29  
**Outcome:** PASS

## Architecture status after this stage

- **40 of 74 controls WORKING FINE — 54%**
- **18 NEEDS ATTENTION — 24%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 10%**

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| SRC-09 | NEEDS ATTENTION | WORKING FINE in isolated PostgreSQL retention-control scope | `20260930003500_retention_payload_disposal`; `scripts/verify-retention-payload-disposal.sql` |

## Implementation completed

- Added a publisher-only disposal-approval routine and worker-only confirmation routine with separate purposes and principals.
- Required expired object and reference retention, released references, no legal hold, approved decisions, exact property context and an exact SHA-256 binding to the object locator.
- Confirmation is idempotent by property and operation key.
- Confirmation marks the payload unusable and scrubs the live object locator and staging token.
- Preserved append-only retention decisions, capture versions, checksums and a new append-only disposal audit.
- Removed direct runtime insert/update paths around the disposal audit and object mutation.
- Updated Prisma and regenerated its client to match the DDL.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| Migration transaction on `p2b_rehearsal_retention2_20260929` | PASS | Tables, forced RLS, policy, triggers, routines and grants applied |
| `scripts/verify-retention-payload-disposal.sql` | PASS | `RETENTION_PAYLOAD_DISPOSAL_PASS` |
| Legal hold | PASS | Approval rejected with `OBJECT_REFERENCE_RETENTION_BLOCK` |
| Cross-property authority | PASS | Rejected with `AUTHORITY_CONTEXT_DENIED` |
| Incorrect locator hash | PASS | Rejected with `PAYLOAD_OBJECT_KEY_MISMATCH` |
| Idempotent confirmation | PASS | Repeated operation returned one immutable audit identity |
| Operation-key/object binding | PASS | Reusing an operation key for another object was rejected |
| Metadata preservation | PASS | Capture version and retention decision remained; disposal audit was append-only |
| `prisma validate` and `prisma generate` | PASS | Prisma proposal and generated client include the disposal fields and audit model |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run verify:p2b:app` | PASS 14/14 | Canonical application controls remained green |
| External object-store deletion | NOT RUN | The worker must delete bytes before confirmation; this stage proves the database confirmation boundary |
| Production | NOT RUN | No production action was taken |

SHA-256:

- `b6418edef3a30f9cb12e80dd102347651c70ccd937fd682e8a0122e9cbb32356` — migration SQL
- `e4a9128a8324130103204093c34f5b7dd42e466e0ff2462583bab22e0e33fa9c` — behavioral fixture

## Remaining P0

1. `APP-05`: repair and prove canonical empty/restored bootstrap ordering.
2. `KRL-05`: enforce present-consent and mixed-source compatibility during rollback.

## Honest boundary

This stage proves database authorization, eligibility, scrubbing and immutable metadata on disposable PostgreSQL. It does not claim that an external object-store adapter deleted physical bytes or that production retention scheduling ran.
