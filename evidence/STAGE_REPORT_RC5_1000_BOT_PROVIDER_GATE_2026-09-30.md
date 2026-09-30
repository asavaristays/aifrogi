# RC5 1,000-bot provider gate — 2026-09-30

## Outcome

**NO-GO for production deployment. Production was not changed.**

All runs exercised 1,000 distinct synthetic bot slugs for 300 seconds at concurrency 30 through the real HTTP bot route and real model provider. The release rule was: all 1,000 bots exercised, combined errors and timeouts no more than 1%, and p95 no more than 8,000 ms.

| Run | Requests | Errors | Timeouts | Error rate | p50 | p95 | Result |
|---|---:|---:|---:|---:|---:|---:|---|
| `gpt-4.1-mini`, implicit pool | 1,331 | 299 | 36 | 25.17% | 5,521 ms | 13,354 ms | FAIL |
| `gpt-4.1-mini`, pool 40 | 1,660 | 0 | 0 | 0.00% | 4,441 ms | 10,803 ms | FAIL |
| `gpt-4.1-mini`, priority tier, pool 40 | 1,015 | 0 | 20 | 1.97% | 8,935 ms | 11,732 ms | FAIL |
| `gpt-4.1-nano`, default tier, pool 40 | 1,000 | 0 | 2 | 0.20% | 9,915 ms | 12,439 ms | FAIL |

The explicit pool fixed the application/database acquisition failures completely in the second run. The remaining blocker is model-provider throughput/latency under the release profile. Changing service tier or model did not satisfy the p95 gate and therefore was not accepted as a production fix.

## Implemented and verified

- Added bounded `AIFROGI_DATABASE_POOL_MAX` configuration, default 40 and constrained to 5–100.
- Added bounded `AIFROGI_CANONICAL_DATABASE_POOL_MAX` configuration, default 10 and constrained to 2–25 per canonical role.
- Added an allowlisted `OPENAI_SERVICE_TIER` request control; unknown values cannot reach the provider request.
- TypeScript check passed.
- P2-B application suite passed 46/46 after the capacity changes.
- A grounded `gpt-4.1-nano` smoke answer passed before its full run, but the full run failed latency.

## Evidence

- `evidence/rc5-load/standard-before-pool.json`
- `evidence/rc5-load/standard-pool40.json`
- `evidence/rc5-load/priority-pool40.json`
- `evidence/rc5-load/nano-pool40.json`

## Cleanup and production state

- Stopped and removed PM2 process `aifrogi-rc5-staging`.
- Dropped only the synthetic database `aifrogi_rc5_load`.
- Production `/api/health/live` and `/api/health/ready` both returned `200`/`ok` after cleanup.
- No production migration, application replacement, nginx admission change, or customer data mutation was performed.

## Required next gate

Obtain provider capacity that can sustain this profile (approved higher throughput/quota or an additional governed provider route), configure it in isolated staging, and rerun the identical five-minute gate. Production deployment remains blocked until that report passes without weakening the thresholds.
