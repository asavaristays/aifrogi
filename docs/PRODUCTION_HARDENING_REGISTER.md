# AiFrogi production-hardening register

Updated: 14 September 2026

This register separates implemented controls from evidence still requiring a production or scale exercise. No item may be represented to an investor as independently certified unless an independent report exists.

| Risk | Current control and evidence | State |
|---|---|---|
| False booking/payment success | Provider-evidence decision boundary; timeout, rejection, malformed/unknown response and duplicate-write tests; Razorpay signature test | Implemented in source; production-provider failure exercise required before unattended transactions |
| Golden-bank rubber stamp | Explicit client save plus reviewer identity, role, time, case count and source revision; save invalidates prior result | Implemented |
| Stale certification | Knowledge revision is derived from crawl and governed-entry timestamps; mismatch fails eligibility; automated unit test | Implemented; live edit exercise should be retained as dated evidence |
| Missed human handover | Durable operation, assignment, response SLA, overdue notification, admin/dashboard visibility and operator tests | Implemented; response quality remains an operating KPI |
| Recrawl concurrency | Current crawl has TTL/freshness handling | Scale gap: queued rate-limited multi-tenant scheduler required before 10 live bots |
| File-backed certification | Certification record remains local-file backed | Scale gap: migrate certification artifact to Postgres/object storage before 10 live bots |
| Runaway AI cost | Per-tenant token/cost metering, configured model rates and warning/critical budget rule | Implemented rule; production budgets must be configured per tenant |
| Connector portability | Generic authentication, operation mapping, encrypted credential lifecycle and health checks; hotel API proven | Architecture implemented; second non-hotel connector remains external validation |

## Investor-safe statement

AiFrogi is ready for controlled pilots with governed intelligence, tenant isolation, human recovery and verified connector boundaries. Unattended transactional use remains approval-gated until provider failure-mode evidence is recorded. Multi-tenant recrawl scheduling, durable certification storage and a second connector family are the defined scale-hardening milestones before expanding beyond the first pilot cohort.
