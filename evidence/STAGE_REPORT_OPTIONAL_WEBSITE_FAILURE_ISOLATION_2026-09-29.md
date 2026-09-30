# Stage Implementation Report

**Stage:** Optional website-capture failure isolation (`SRC-07`)  
**Date:** 2026-09-29  
**Outcome:** PASS

## Architecture status after this stage

- **38 of 74 controls WORKING FINE — 51%**
- **20 NEEDS ATTENTION — 27%**
- **9 NOT IMPLEMENTED — 12%**
- **7 NOT RUN — 10%**

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| SRC-07 | NEEDS ATTENTION | WORKING FINE in isolated PostgreSQL and HTTP journey scope | `scripts/verify-optional-website-failure-isolation.sql`; previously passing `scripts/verify-p2b-http-journeys.ts` |

## Implementation completed

- Added an executable database fixture that records a failed website capture and creates an exact release containing only approved PDF, spreadsheet and form versions.
- Proved sealing and compare-and-set activation succeed without a website member.
- Proved the failed website capture is not silently inserted into the active release.
- Extended the main multi-source fixture so future full rehearsals retain this behavior.
- No legacy or profile fallback was introduced. WhatsApp was not changed.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| Disposable clone `p2b_rehearsal_optional_clone2_20260929` | PASS | `OPTIONAL_WEBSITE_FAILURE_ISOLATION_PASS`; pointer generation advanced to 2 with exactly three non-website members |
| `npm run typecheck` | PASS | TypeScript compiler completed with no errors |
| `npm run verify:p2b:app` | PASS 14/14 | Canonical policy, release, serving, no-fallback and material-claim tests |
| Full HTTP optional-website journey | PASS from prior P2-B execution; not rerun in this stage | `scripts/verify-p2b-http-journeys.ts` records one failed capture and delivers approved form evidence |
| Fresh empty-database bootstrap | FAILED; remains separate APP-05 work | Historical baseline invoked `aifrogi_security.is_session_active(text)` before it existed; no `db push` substitution used |
| Production | NOT RUN | Production was not changed by this stage |

Fixture SHA-256:

- `515c121bacde090d18752d1732bab4844be6826e2ce8620acb877a2c37013c45` — `scripts/verify-optional-website-failure-isolation.sql`
- `e979fba15678f242af37a6d0bc6d0a86fa4ce3549236291ae1fba47891551adb` — `scripts/verify-multisource-knowledge-release.sql`

## Remaining P0

1. `APP-05`: repair and prove the canonical empty/restored database bootstrap ordering without `prisma db push`.
2. `SRC-08`: run release-wide revocation races across mixed sources, cache and delivery.

## Honest boundary

This stage closes only `SRC-07` in the stated isolated PostgreSQL and HTTP-journey scope. It does not claim production deployment, fleet-wide rollout, fresh bootstrap success or mixed-source revocation-race closure.
