# Active Crawl Serving Standard

Status: enforced for every tenant with an authorized active crawl generation.

## Non-negotiable serving rule

Once a property has an authorized `ACTIVE` `WebsiteCrawlGeneration`, every factual answer must use that generation only. The serving path must not consult legacy claims, a filesystem crawl cache, a superseded generation, another property, or unbound model memory.

If the active generation supplies no relevant evidence, the bot must fail closed against current knowledge. Missing evidence is an AiFrogi ingestion/retrieval condition; it must not be represented as an enterprise-client compliance failure.

## Required answer evidence

Every delivered crawl answer must record:

- property ID;
- active generation ID;
- ordered chunk IDs;
- exact question and answer;
- answer hash, model, delivery key and delivery state;
- canonical conversation ID.

The database rejects stale generations, foreign chunks, cross-property context and duplicate delivery keys with different answer bytes.

## Generation lifecycle

1. Crawl into a private capture.
2. Validate authority, page coverage, chunk coverage and content hash.
3. Materialize a new `BUILDING` generation.
4. Complete acceptance tests without serving it publicly.
5. Atomically mark the previous generation `SUPERSEDED` and the candidate `ACTIVE`.
6. Serve only the active generation.
7. Treat source revocation as immediate loss of serving eligibility.

## Release acceptance

A bot cannot be marked accepted unless:

- representative questions pass through the real HTTP route;
- every factual answer is bound to the active generation and nonempty chunk IDs;
- no legacy claim IDs appear;
- unsupported questions do not use legacy or cross-tenant information;
- cross-property, stale-generation and foreign-chunk tests are rejected;
- delivered answers create durable audit rows;
- rollback retains the factual edge in a closed state until compatibility passes.

These are platform engineering responsibilities. Client content is input, not an excuse for unsafe fallback behavior.
