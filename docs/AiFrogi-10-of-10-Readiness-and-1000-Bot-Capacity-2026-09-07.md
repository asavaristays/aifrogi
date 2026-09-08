# AiFrogi 10/10 readiness milestone and 1,000-bot capacity position

Date: 2026-09-07
Production release: `readiness-programme-20260907`
Status: readiness controls deployed; 1,000-bot concurrency is not yet certified.

## Deployed milestone

- Canonical route guard checks 135 route sources, rejects retired WhatsApp/campaign/legacy-preview surfaces, and requires 13 active route groups.
- Twenty-four obsolete production route files were removed.
- Billing notification failures enter a bounded retry queue and exhausted retries create a high-severity operational incident.
- Admin Today exposes retry, dead-job, incident, and billing-email failure health.
- Commercial readiness tests cover route discipline, tenant/payment boundaries, billing idempotency evidence, and the configurable widget load probe.
- An isolated PostgreSQL restore-verification command is available for disaster-recovery testing.
- Production health passed for database, session secret, public URL, Meta webhook signature, and legacy inbound token.
- Public widget rendering passed 20 concurrent requests with 20 HTTP 200 responses. This verifies widget delivery only; it does not certify concurrent AI conversations.
- Rollback snapshot: `/var/backups/aifrogi/readiness-programme-20260907.QfA5Uv`.

## What “1,000 bots” means

Capacity must be stated in four separate measures:

1. **1,000 registered bots:** tenant configurations stored in PostgreSQL. This is a reasonable current capability, subject to a data-volume test.
2. **1,000 installed widgets:** scripts embedded across customer websites but mostly idle. This is also a reasonable current capability because idle installations create negligible application work.
3. **1,000 daily active bots:** requires a defined messages-per-day and peak-hour distribution before certification.
4. **1,000 simultaneous AI conversations:** not proven and not approved as a production claim.

## Current production evidence and limits

- VPS: 2 CPU cores, 7.8 GiB RAM, no swap, approximately 37 GiB disk free at assessment time.
- Application: one PM2 Node.js process in fork mode. This creates a single application execution bottleneck and does not use both CPU cores through application clustering.
- Public request throttling is held in process memory. It is not shared across future PM2 instances and resets after a process restart.
- Conversation exclusion correctly uses PostgreSQL advisory transaction locks, but each active turn can hold database and application resources for the duration of model and persistence work.
- The automation worker processes bounded batches of 25; backlog drain time under high load has not been measured.
- The current load probe is capped at 50 and exercises widget HTML rendering, not full message, model-provider, credit, evidence, persistence, email, or handover paths.
- Production has passed 20 simultaneous widget loads. No evidence currently supports a 1,000-simultaneous-conversation promise.

## Capacity decision

AiFrogi may plan for and onboard up to 1,000 registered or installed bots with controlled activation and monitoring. It must not market or contractually guarantee 1,000 concurrent conversations until the certification below passes.

## Certification programme before a 1,000-conversation claim

1. Define the business traffic target: installed bots, daily conversations, peak requests per second, message length, and expected model latency.
2. Replace process-memory throttling with a shared Redis-compatible rate limiter and shared abuse controls.
3. Separate web traffic and background jobs; run independently scalable workers with queue-depth and oldest-job-age alerts.
4. Configure and measure PostgreSQL connection pooling, query latency, lock contention, slow queries, storage growth, and restore time.
5. Add application replicas behind the reverse proxy, with graceful restart and health-based removal. Scale only after shared throttling and worker separation.
6. Run progressive production-like tests at 50, 100, 250, 500, and 1,000 concurrent conversations using a mock model first, followed by a cost-capped real-provider canary.
7. Pass agreed service objectives for p95 response time, error rate, queue lag, database saturation, credit correctness, tenant isolation, and zero duplicate commercial actions.
8. Prove overload behaviour: bounded queues, 429/back-pressure responses, recovery without data loss, and rollback under partial dependency failure.
9. Record infrastructure cost per 100 and 1,000 conversations so plan pricing protects startup margins.

## Mentor recommendation

Use **1,000 installed bots** as the near-term architecture target, but certify traffic in stages. The next economical test should be 100 concurrent full conversation starts using a mocked model response, followed by database and queue analysis. Do not jump directly to 1,000 or spend real model credits until the 100-user bottlenecks are understood.
