# Stage Implementation Report

**Stage:** Signed machine policy and exact release identity core  
**Date:** 2026-09-29  
**Outcome:** PASS — implementation core; deployment enforcement remains next stage

## Architecture status after this stage

- **32 of 74 controls WORKING FINE — 43%**
- **25 NEEDS ATTENTION — 34%**
- **10 NOT IMPLEMENTED — 14%**
- **7 NOT RUN — 9%**

The counts total 74. Percentages are rounded.

## Status changes

| Control | Before | After | Evidence |
|---|---|---|---|
| GOV-02 | NOT IMPLEMENTED | NEEDS ATTENTION | `lib/bot-machine-policy.ts`; `tests/p2b/bot-machine-policy.test.ts`; 5/5 focused tests, 8/8 P2-B tests, TypeScript and isolated production build PASS |

## Implementation completed

- Strict machine policy v1 with constitution `1.1` binding.
- Exact source/version/authorization/digest membership.
- Evidence threshold, conflict behavior, handover, retention, delivery and compatibility rules.
- Unknown fields are rejected rather than treated as prompt authority.
- Idempotency and uncertain-delivery requirements cannot be disabled.
- Deterministic canonical JSON and SHA-256 policy identity.
- RSA-SHA256 policy signing and mutation rejection.
- Exact bot release manifest binding property, policy hash, knowledge-release hash, application build, database schema, serving contract, retrieval version and adapter versions.
- Release verification rejects wrong property, policy, knowledge, build, schema or serving contract.

## Tests and evidence

| Gate | Result | Evidence |
|---|---|---|
| Focused machine-policy tests | PASS 5/5 | `node --import tsx --test tests/p2b/bot-machine-policy.test.ts` |
| Complete P2-B app tests | PASS 8/8 | `npm run verify:p2b:app` |
| TypeScript | PASS | `npm run typecheck` |
| Isolated VPS production build | PASS | `/var/tmp/aifrogi-reconcile-20260929` |

## Remaining P0

1. Persist the signed policy and exact release identity through canonical property-scoped database records and routines.
2. Require their hashes at application startup and deployment admission.
3. Implement the atomic multi-source knowledge release referenced by `knowledgeReleaseHash`.

## Honest boundary

This stage implements and tests cryptographic policy/release identity. It does not yet make production serving depend on that signed policy, so GOV-02 remains NEEDS ATTENTION rather than WORKING FINE.
