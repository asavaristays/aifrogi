# RC5 Tier 1 functional fleet test — 2026-09-30

## Outcome

**PASS for 1,000-bot functional operation at concurrency 4.**

This is evidence that all 1,000 isolated bot identities can answer through the real HTTP route and model provider within the current Tier 1 token allowance. It does not replace the failed concurrency-30 production-capacity gate.

| Measure | Result | Required |
|---|---:|---:|
| Unique bots exercised | 1,000 | 1,000 |
| Duration | 300 seconds | at least 300 seconds |
| Concurrency | 4 | controlled Tier 1 profile |
| Completed requests | 1,000 | at least 1,000 |
| Errors | 0 | combined rate no more than 1% |
| Timeouts | 0 | combined rate no more than 1% |
| Error rate | 0.00% | no more than 1% |
| p50 | 1,461 ms | recorded |
| p95 | 2,385 ms | no more than 8,000 ms |
| p99 | 4,185 ms | recorded |

Machine report: `evidence/rc5-load/functional-tier1-c4.json`.

## Isolation and controls

- Created disposable database `aifrogi_rc5_functional` from a root-only production snapshot.
- Applied the seven rehearsed RC5 migrations atomically to the disposable database.
- Seeded 1,000 synthetic property slugs using `ops/seed-rc5-functional-fleet.sql`.
- Started isolated PM2 process `aifrogi-rc5-functional` on port 3021.
- The staging launcher used an explicit secret allowlist and did not inherit production canonical-role database URLs.
- Canonical production enforcement was disabled only for this synthetic functional fixture; production configuration was not changed.
- A grounded smoke request passed before the fleet run.

## Cleanup and production verification

- Preserved the machine report in the repository.
- Removed PM2 process `aifrogi-rc5-functional`.
- Dropped only database `aifrogi_rc5_functional`.
- Removed the temporary database snapshot.
- Production live and ready endpoints both returned `ok` after cleanup.

## Release interpretation

The system is functionally ready for a controlled pilot at Tier 1 and low concurrency. Production capacity at concurrency 30 remains **NOT PASSING** until context-token demand is reduced or the provider account reaches a tier with sufficient TPM, followed by the unchanged capacity rerun.
