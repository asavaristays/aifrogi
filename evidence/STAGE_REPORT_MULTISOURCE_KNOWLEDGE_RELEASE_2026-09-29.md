# Stage report: multi-source knowledge release

Date: 2026-09-29  
Scope: isolated implementation and disposable PostgreSQL verification  
Production state: unchanged

## Implemented

- Exact immutable membership for website, PDF, spreadsheet and form/profile facts.
- Composite foreign keys bind every captured member to its property, source revision, capture and capture version.
- Structured sources bind directly to the exact source-revision configuration hash.
- Exact manifest-hash approval is required before registration.
- Sealing verifies complete membership against the manifest; partial releases cannot seal.
- Membership is closed after sealing.
- Activation rechecks present source authorization, consent time window and revocation.
- Compare-and-set active pointer rejects stale generations.
- Runtime roles have no direct mutation privileges; forced RLS covers every new property table.
- Signed bot activation now requires its `knowledgeReleaseHash` to equal the exact active multi-source release hash.

## Verification

| Check | Result |
|---|---|
| Prisma validation and generation | PASS |
| TypeScript | PASS |
| P2-B application suite | PASS — 10/10 |
| Empty disposable bootstrap with all migrations | PASS |
| Website/PDF/spreadsheet/form exact membership | PASS |
| Exact approval enforcement | PASS |
| Incomplete membership sealing rejection | PASS |
| Stale pointer activation rejection | PASS |
| Revoked source activation rejection | PASS |
| Active release public lookup | PASS |
| Bot release to active knowledge hash binding | PASS |
| Direct runtime member writes denied | PASS |
| Forced RLS | PASS |
| Isolated production build | PASS |
| Production migration/activation | NOT RUN |

Disposable test emitted `MULTISOURCE_KNOWLEDGE_RELEASE_PASS`.

## Artifact hashes

- Prisma schema: `48343c253c811c6a36b51763c24270bb04be91db898a31f88e1f64856bb0288c`
- Migration: `2dfcb22228509b251c03985ebbf1dec28b14dc432d519793cb51bba736bb8bf6`
- Behavioral fixture: `b112cddb19d5108970531609d20057e41b909732293458d7f7486f9ecead904e`
- Disposable bootstrap: `a7b0d887ab8558ea95caaaf23f8f06384a885a6cd839c93ffebbe70a4f9d8e66`

## Architecture status change

- KRL-02: NOT IMPLEMENTED -> WORKING FINE in isolated P2-B scope.
- KRL-03: NEEDS ATTENTION -> WORKING FINE in isolated P2-B scope.
- Totals: 36 Working Fine, 22 Needs Attention, 9 Not Implemented, 7 Not Run.

## Next P0 stage

Eliminate alternate legacy factual serving branches and prove every factual route/channel is unable to bypass the active knowledge release.
