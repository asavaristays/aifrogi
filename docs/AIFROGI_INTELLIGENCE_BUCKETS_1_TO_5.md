# AiFrogi intelligence delivery buckets

The five buckets are deliberately sequenced and Core/Tenant work is never mixed in one release.

1. **Tenant truth governance** — source authority, contradiction handling, freshness visibility and a client review queue.
2. **Tenant entity intelligence** — entity catalogue, aliases, spelling tolerance and category vocabulary.
3. **Core conversation intelligence** — confidence-based answer/clarify/handover policy and durable within-session entity memory.
4. **Tenant learning lifecycle** — crawl change detection, scheduled verification and grouped unanswered-question drafting.
5. **Certification** — tenant-generated smoke/golden sets and mandatory pre-publish regression across facts, privacy and recovery.

Implementation status: all five buckets are live. Bucket 5 is deployed as `TI-020` with tenant smoke/golden certification enforced before review submission and go-live.

Only the active bucket may be implemented and deployed. Each bucket must pass focused, isolation and regression checks before the next begins.
