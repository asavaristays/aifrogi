# Stage Implementation Report

**Stage:** Remaining control closure: TXN-01, TXN-02 hardening, SRC-10 and APP-08  
**Date:** 2026-09-30  
**Outcome:** PASS in the explicitly tested scopes; production NOT RUN

## Architecture status after this stage

- **60 of 74 controls WORKING FINE — 81%**
- **2 NEEDS ATTENTION — 3%**
- **6 NOT IMPLEMENTED — 8%**
- **6 NOT RUN — 8%**

These counts come from a fresh row-by-row recount of the 74 detailed controls. The previous summary undercounted a primary `WORKING FINE` row whose label also recorded a production `NOT RUN` boundary; the detailed row was not changed to manufacture this correction.

## Status changes

- **TXN-01:** NEEDS ATTENTION → **WORKING FINE for admitted FlowCart and demo action paths** — material mutations now require capability membership, immutable preview, explicit confirmation and a stable idempotency key. New connectors remain unadmitted until they use the same gateway.
- **SRC-10:** NEEDS ATTENTION → **WORKING FINE in admitted persistence scope** — the shared recursive interceptor now protects canonical conversation and metadata, knowledge content, website error records, legacy lead messages, support messages and sovereign answer evidence before persistence.
- **APP-08:** NEEDS ATTENTION → **WORKING FINE in integrated disposable PostgreSQL scope** — the closed-edge wrapper executed the actual compatibility check and compatible knowledge/bot pointer rollback on a freshly bootstrapped canonical database. Incompatible runtime and stale generation paths failed closed.
- **TXN-02:** remains **NEEDS ATTENTION / real connector NOT RUN** — timeout is now durably `UNCERTAIN`, provider acceptance followed by commit failure is `UNCERTAIN`, and a duplicate operation key does not resend. Provider-specific production behavior is not inferred.
- **APP-01:** remains **NEEDS ATTENTION** — the deterministic source checkpoint passes, but the wider working tree is not one reviewed signed release commit. It was not silently committed because it contains broad pre-existing user work.

## Tests and evidence

| Check | Result |
|---|---|
| `npm run typecheck` | PASS |
| `npm run verify:p2b:app` | PASS — 31/31 |
| Fresh disposable baseline plus canonical migrations | PASS |
| `scripts/verify-multisource-knowledge-release.sql` | PASS |
| Real compatibility routine through `ops/verify-edge-closed-rollback.sh` | `COMPATIBLE_KNOWLEDGE_ROLLBACK_PASS`; `EDGE_CLOSED_ROLLBACK_PASS` |
| Shell syntax for rollback/catalog tools | PASS |
| Deterministic release source checkpoint | PASS — 15 files; hash `41fb293954e3df96ed7654fc5766fdf4995087c84cb98af9b5f08c4a683ab220` |
| Production mutation or deployment | **NOT RUN** |
| Real external connector ambiguity test | **NOT RUN** |

## Important implementation correction

A provider timeout is not a proven rejection: the provider may have accepted the request before the client timed out. The transaction gateway now persists `UNCERTAIN / PROVIDER_TIMEOUT_OUTCOME_UNKNOWN` instead of incorrectly recording `FAILED`. Duplicate calls converge on that durable result and do not resend.

## Remaining P0

1. **APP-01:** reconcile the broad working tree into one reviewed commit, then generate and sign the exact source manifest.
2. **TXN-02:** run the same timeout, duplicate and accepted-send/commit-failure fixtures against each real connector before that connector is admitted.
3. **HND-03:** prove real staff join, resolution, expiry and SLA behavior.
4. **MON-06/MON-07/MON-10:** execute representative 1,000-bot pool, latency and sustained/burst qualification.

No production action was taken in this stage.
