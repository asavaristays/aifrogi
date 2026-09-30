# Stage Implementation Report

**Stage:** Source revocation and delivery races (`SRC-08`)  
**Date:** 2026-09-29  
**Outcome:** PASS

## Architecture status after this stage

- **39 of 74 controls WORKING FINE — 53%**
- **19 NEEDS ATTENTION — 25%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 10%**

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| SRC-08 | Working for the website routine; full races needed attention | WORKING FINE in isolated PostgreSQL canonical-delivery scope | `scripts/verify-p2b-delivery.ts`, `scripts/verify-p2b-canonical-core.ts`, `scripts/verify-p2b-races.ts` |

## Implementation completed

- Added the missing revocation-first delivery test to the canonical boundary.
- Proved a committed revocation rejects a cached claim before provider I/O and creates no pending answer audit.
- Retained and reran the inverse ordering: eligibility is locked before provider I/O, so an already-authorized in-flight delivery commits before revocation.
- Proved source revocation invalidates only dependent evidence; an unrelated approved claim remains eligible.
- Proved concurrent evidence and publication-membership mutation cannot cross their sealing boundary.
- WhatsApp and production were not changed.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| `npm run verify:p2b:delivery` on `p2b_rehearsal_revocation2_20260929` | PASS 7/7 | Includes provider timeout, commit ambiguity, idempotency, delivery-first revocation and revocation-first cached retry |
| `npm run verify:p2b:core` on `p2b_rehearsal_revocation_core_20260929` | PASS 13/13 | Dependent evidence became ineligible; unrelated approved evidence stayed eligible |
| `npm run verify:p2b:races` on the same disposable database | PASS 2/2 | Claim evidence and publication membership remained immutable during concurrent sealing |
| `npm run typecheck` | PASS | No TypeScript errors |
| `npm run verify:p2b:app` | PASS 14/14 | Canonical application boundaries remained green |
| Production | NOT RUN | No production action was taken |

Relevant SHA-256:

- `b031f2aff5a0bea84f1660cae48b3922f6399fe716af614d80c25f83b29277fb` — `scripts/verify-p2b-delivery.ts`
- `7f18e0d31918c525a590a73283e49c96e56fe1f26ade4eb2d1028b9abf8ddbf2` — `scripts/verify-p2b-canonical-core.ts`
- `68b9cd95126948cc59d63484f4b1df9c46cefe617e58a69f9f065b9f3151b8eb` — `scripts/verify-p2b-races.ts`

## Remaining P0

1. `APP-05`: repair and prove canonical empty/restored bootstrap ordering.
2. `SRC-09`: separate purgeable source payload from append-only audit metadata and test retention execution.

## Honest boundary

This closes `SRC-08` only in the isolated PostgreSQL canonical website-delivery scope. It does not claim production execution or coverage for channel adapters that are not implemented and admitted.
