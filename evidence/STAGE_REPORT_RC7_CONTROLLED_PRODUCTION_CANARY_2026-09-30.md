# RC7 controlled production canary — implementation report

Date: 2026-09-30  
Target: `app.aifrogi.com` / `webtechnosys-fresh-ai-bot-03e89f`  
Decision: **CONTROLLED CANARY ACTIVE; GLOBAL PRODUCTION HELD**

## Release identity

- Git commit: `861c05ac87ca536ab0ef5c17ea58463decdac3a4`
- Release: `p2b-v6-20260930-rc7`
- Immutable archive SHA-256: `159736302fb16a19fa49afb5dad569b144a90ba1bc168467cc6f74b521ddf6dc`
- Serving contract: `1`
- RC6 rollback: `/var/www/lead-os-ai.rollback-rc6-20260930T051754Z`

RC7 corrects the crawl-evidence binding defect by validating material-claim coverage against the exact final HTTP answer after deterministic formatting and conversation controls. The final decisions, not draft decisions, are persisted through canonical delivery.

## Executed gates

| Gate | Result | Evidence |
|---|---:|---|
| TypeScript | PASS | `npm run typecheck` on exact server archive |
| P2-B application tests | PASS 46/46 | `npm run verify:p2b:app` |
| Production build | PASS | `npm run build` on production host |
| Release archive hash | PASS | Local and server SHA-256 identical |
| Production backup | PASS | `/var/backups/aifrogi/aifrogi-20260930T044428Z.dump.gz.enc` |
| Isolated restore | PASS | Encrypted backup checksum verified; 112 public tables restored into temporary PostgreSQL |
| Production migrations | PASS | Seven pending governed-control migrations applied atomically before RC7 |
| Post-migration security catalogs | PASS capture | `/var/backups/aifrogi/catalog-after-20260930T052711Z`; checksums copied to this evidence directory |
| Signed deployment admission | PASS | RSA signature, archive hash, active-release record, serving contract, nginx syntax and reload |
| Canary isolation | PASS | Direct loopback returned 200; unallowlisted public source returned 503 |
| Approved operator route | PASS | Page HTTP 200; factual contact API HTTP 200, grounded with three sources |
| Monitoring smoke | PASS 3/3 | Three admitted external factual requests returned 200, grounded, three sources; readiness 200 |
| Human handover | PASS | HTTP 200, `HUMAN_REQUESTED`, handover available |

## Twenty-question result

The paced production canary returned HTTP 200 for all 20 questions. Fourteen returned grounded answers; six returned the governed evidence-gap/human-help response. There were no HTTP 402 or 503 results after the audited canary credit grant.

- Grounded: 14/20
- Safe evidence gaps: 6/20 (questions 3, 4, 5, 8, 11 and 14)
- HTTP/system failures: 0/20
- p95: 2,167 ms
- Handover: PASS
- Raw evidence: `RC7_PRODUCTION_CANARY_20_AND_HANDOVER_2026-09-30.json`

The six safe gaps are a knowledge/retrieval-quality backlog. They are not treated as grounded passes and validation was not weakened to make them pass.

## Production state and holds

Nginx release admission is enabled, but factual routes remain restricted to loopback and the explicitly approved operator `/32` addresses. Unallowlisted traffic continues to receive 503. This is a controlled canary, not a global launch.

The following are still held:

1. Global factual-route opening.
2. Concurrency-30/provider-capacity approval; Tier 1 has only proven the controlled low-concurrency profile.
3. Per-property signed `BotReleaseArtifact` enforcement (`AIFROGI_SIGNED_BOT_RELEASE_REQUIRED=1`); deployment-source signing is active, but the application-level knowledge/policy release pointer has not been instantiated for this bot.
4. Promotion of the six evidence-gap questions to grounded answers; these require improved indexed coverage/retrieval and another 20-question comparison.

No customer-wide or fleet-wide rollout is authorized by this report.
