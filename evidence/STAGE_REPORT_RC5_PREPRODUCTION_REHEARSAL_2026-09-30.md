# RC5 pre-production rehearsal report

**Date:** 2026-09-30  
**Candidate:** `p2b-v6-20260930-rc5`  
**Final source commit:** `4b54c7919af74f68733fcd8cc4ef616c44364e18`  
**Outcome:** PRE-PRODUCTION REHEARSAL PASS; PRODUCTION DEPLOYMENT HELD AT SIGNING AUTHORITY

## Corrections made during rehearsal

1. Signed-release SQL fixtures now read protected pointer state only before assuming the publisher role and calculate pointer generations from observed state.
2. Compatible-rollback fixtures now calculate all expected generations from observed state and run before destructive retention disposal.
3. The 1,000-bot HTTP harness now sends the real route field, `message`, instead of the invalid `question` field.
4. The load harness now requires every one of the 1,000 unique bot slugs to be exercised before it can pass.

## Passing evidence

| Gate | Result |
|---|---|
| Clean committed source snapshot | PASS |
| P2-B application tests | PASS — 44/44 |
| Local TypeScript | PASS |
| Local production build | PASS — 99 routes |
| Root-only archive upload/hash verification | PASS |
| Production database copied into separate rehearsal database | PASS |
| Pending migrations on restored production copy | PASS |
| Multi-source release fixture | PASS |
| Signed bot release fixture | PASS |
| Material claim enforcement fixture | PASS |
| Compatible knowledge rollback fixture | PASS |
| Retention payload disposal fixture | PASS |
| Per-bot factual closure fixture | PASS |
| Governed control-plane fixture | PASS |
| Exact uploaded archive server build | PASS |
| Active production release after rehearsal | PASS — remained RC4 |
| Production readiness after rehearsal | PASS — HTTP 200 |
| Temporary restored database and unencrypted dump cleanup | PASS |

## Remaining production blocker

RC4 did not retain an approved reusable public/private release-signing pair. Creating a new root-held production signing identity changes the production trust root and was not inferred from general deployment authorization. RC5 has therefore not been signed, admitted, migrated into production, or activated.

The sustained 1,000-bot real HTTP/model-provider run also remains pending. It can incur provider traffic and must use 1,000 provisioned staging bots; disposable database capacity is not substituted for that evidence.

## Production state

- Active release remains `p2b-v6-20260929-rc4`.
- Readiness returned HTTP `200` after cleanup.
- No RC5 production migration, process switch, nginx admission, or customer-route opening occurred.
