# RC10 source-neutral retrieval deployment report

Date: 2026-09-30  
Target: `app.aifrogi.com` / `webtechnosys-fresh-ai-bot-03e89f`  
Decision: **RC10 DEPLOYED; RESTRICTED CANARY REMAINS ACTIVE**

## Release identity

- Git commit: `abb5ac1`
- Release: `p2b-v6-20260930-rc10`
- Archive SHA-256: `7758281bd962a0af2571a4478cf976492990469250e09f57a950e7a69f47e9e7`
- Rollback: `/var/www/lead-os-ai.rollback-rc9-20260930T075831Z`
- Signed admission: PASS
- PM2 process: online

## Deployment gates

| Gate | Observed result |
|---|---|
| Archive hash before extraction | PASS |
| TypeScript on staged server tree | PASS |
| P2-B application tests | PASS — 53/53 |
| Production build on staged server tree | PASS |
| Temporary-port liveness smoke | PASS |
| Atomic swap and production liveness | PASS |
| Signed active-release admission | PASS |
| Nginx restricted canary allowlist | PRESERVED |
| Chrome page load | PASS |

## Chrome observations

| Question | Observed result |
|---|---|
| What services does Webtechnosys provide? | Grounded, specific answer covering software, mobile, automation, transformation, hospitality AI, training and AI filmmaking |
| How can Webtechnosys help hotels improve direct demand and revenue? | Safe evidence-gap response and human-help offer; no invented answer |

## Fresh-session twenty-question canary

- HTTP 200: 20/20
- Grounded on first pass: 19/20 (95%)
- Sources on grounded answers: 3
- p95: 4,626 ms
- First-pass miss: `How can I contact Webtechnosys?`
- Exact contact question passed with `info@webtechnosys.com` and `+91 74105 82898`.
- The missed broad contact wording passed when rerun after the test-credit grant.
- Initial handover probe returned HTTP 402 because the twenty questions exhausted reply credits.
- A capped 100-credit regression grant was recorded through the audited billing path (`cmuntwb2p0000kqkxwlndoigw`, expires 2026-10-30).
- Handover rerun: HTTP 200, `HUMAN_REQUESTED`, handoff available.

Raw first-pass evidence: `RC10_PRODUCTION_CANARY_20_AND_HANDOVER_2026-09-30.json`.

## Important architecture observation

The Webtechnosys property currently has no `KnowledgeReleaseActivePointer`. RC10 is therefore serving this tenant through the active website-crawl compatibility bridge. The new source-neutral release query is deployed but was **not exercised by this tenant**. A disposable or pilot tenant with an activated WEBSITE/PDF/SPREADSHEET/FORM release is still required before claiming online multi-source behavior.

## Quality assessment

The factual-answer target of at least 8/10 is met by this canary at 19/20 grounded on the first pass. The system remained fail-closed on the observed hotel-revenue gap. Broad contact retrieval remains mildly nondeterministic and should be included in the next fixed regression set. No global canary expansion is authorized by this report.
