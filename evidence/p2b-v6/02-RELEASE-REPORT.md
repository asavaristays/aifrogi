# AiFrogi P2-B v6 release-candidate report

Date: 2026-09-29. Checkout base: `99fb911ab008d92d91bf6f66c9f9cb5033f4e657`.
Original review ZIP SHA-256: `ddd88206dd4486313d9170c3ef7f14f3002dc62c4965ea0d2fedff83220e97ec`.
Environment: isolated local checkout, disposable PostgreSQL on
`127.0.0.1:55433`, and disposable Homebrew nginx on localhost.
No production database, service, edge, tenant, or customer record was contacted.

## Release status

**LOCAL RELEASE GATES PASS — PRODUCTION APPROVAL REQUIRED.** Database bootstrap,
rollback, restore, role boundaries, canonical behavior and races, five-source
HTTP journeys, the built website route, signed nginx admission, restored-build
routing, TypeScript and Webpack build gates pass. No production system was
contacted; rollout remains held for the separately required approval.

## Saved migration inputs

| Artifact | SHA-256 |
| --- | --- |
| Corrected Part 3 | `72b44ff9d7bac837718364d0a12c4ce2150085cd20bbc8815444e0bd2f385e48` |
| Corrected Part 15 | `4329000a1e81da9eacffdd1c54418922739800fe060134a092dd781378358038` |
| Corrected Part 5 | `e909cf4ee505b251de7443969237df0677350cf03aefdcc49159ea3cc5071e53` |
| Baseline SQL | `a149e4008efae6e39012183f6c3ca41978a0458080b74317c62752fb4c028e58` |
| Runtime roles SQL | `857b511a0ab12189ba5eee5789e123ab273b92900550b44941a92e64cf97cee1` |
| Deployment admission | `223c684d5ec051511d6f47f9d99845da1203d6b611346f0dfbc041c4385fbb0f` |
| Combined v6 migration | `f8adfc2301eaa19158d6846fec8802ffb2961a03b56a29522610225e0f74f347` |
| Post-bootstrap catalog export | `348d022626c15a12623fa80bef959adb84665fb3ffa91f556beccff36b4decac` |

The exact original-to-corrected diffs are `part-03-corrections.diff`,
`part-15-corrections.diff`, and `part-05-corrections.diff` in this directory.

## Commands and observed results

1. Historical migrations: `DATABASE_URL=... npx prisma migrate deploy` on an
   empty disposable database — **REJECTED AS UNSUPPORTED**. Migration
   `20260829000000_channel_independent_foundation` references `Property` before
   that table exists. The versioned baseline plus v6 migration is now the tested
   release procedure; `prisma db push` is not part of it.
2. Clean baseline: `DATABASE_URL=... sh scripts/p2b-bootstrap-disposable.sh`
   — **PASS** on `bootstrap_p2b_rehearsal2`.
3. Backfill dry run and commit run using corrected Part 5 — **PASS**. Dry run
   rolled back with parity; commit mapped one legacy entry and quarantined the
   unmatched retained document as `NO_EXACT_AUTHORIZED_SOURCE`.
4. Forced rollback: baseline followed by
   `psql ... -f tests/p2b/force-migration-rollback.sql` — expected division by
   zero; `to_regclass('public."KnowledgeSource"') IS NULL` — **PASS**.
5. Restore: `pg_dump -Fc`, `createdb`, `pg_restore` — **PASS**. Normalized
   schema hashes before/after restore both
   `854a7497730f18fc7ac5dbd56d6beafbdcfdea08afeb901d6b85f45379aa821e`.
   Dump SHA-256:
   `aadefd7297a1c5dad7f4901dc3152f8a0fa92db30b62d803352dda0a0339f2de`.
6. `DATABASE_URL=... sh scripts/verify-p2b-role-boundaries.sh` — **PASS 7/7**:
   authorized session, direct-write denial, cross-property denial, forged
   principal denial, reparent denial, answer append-only, handover append-only.
7. `npm run verify:p2b:app` — **PASS 3/3** for exact build admission and
   fail-closed legacy/contract/release-ID checks.
8. Focused form, optional website, spreadsheet, PDF and website-failure suite
   via Node test runner — **PASS 38/38**.
9. `npm run typecheck` — **PASS**.
10. `npx next build --webpack` — **PASS**, 97 routes. The default Turbopack
    attempt was stopped after it made no progress; the supported Webpack build
    completed successfully.
11. `DATABASE_URL=... npm run verify:p2b:delivery` on a newly bootstrapped
    database — **PASS 6/6**. An altered answer was rejected before provider I/O
    with a durable failed outcome, and PostgreSQL independently rejected a
    forged delivered-answer binding. Provider timeout retained the committed pending
    audit and appended a durable `FAILED` outcome with
    `deliveryUncertain=true`; provider acceptance followed by a forced deferred
    commit failure appended `FAILED` with `providerAccepted=true`; two outcome
    calls with one delivery key produced exactly one immutable row; source
    revocation serialized behind an in-flight accepted delivery.
12. `DATABASE_URL=... npm run verify:p2b:core` on a newly bootstrapped database
    with explicit `aifrogi_publisher` and `aifrogi_worker` connection URLs —
    **PASS 13/13**: forged consent identity denied, incomplete sealing denied,
    full claim and qualifications
    sealed, evidence immutability, inexact/exact publication authorization,
    publication-membership immutability, pointer CAS, worker lease fencing,
    reclaim/finalization, and scoped source revocation.
13. `DATABASE_URL=... AIFROGI_PUBLISHER_DATABASE_URL=... npm run verify:p2b:races`
    — **PASS 2/2**. Concurrent
    evidence insertion and publication-membership deletion blocked behind the
    relevant seal lock and were rejected after sealing committed.
14. `DATABASE_URL=... npm run verify:p2b:http` — **PASS 6/6**. Real localhost
    HTTP requests covered form, PDF, spreadsheet, website, and failed optional
    website capture falling back to authorized form evidence; all five answers
    had durable audits and delivered outcomes.
15. `DATABASE_URL=... npm run verify:p2b:route` — **PASS**. The built Next.js
    `/api/public/website-bot/http-property` route returned `200`, `grounded=true`
    and `Form fact.`, with a durable canonical `DELIVERED` outcome. This test
    found and fixed missing bootstrap resolvers, uncommitted conversation
    visibility, and the cross-bundle role-client registry.
16. `npm run verify:p2b:edge` — **PASS 8/8** against real nginx: factual edge
    closed, bad signature rejected, old contract rejected, inactive build
    rejected, simulated reload failure restored the closed file and left the
    live edge closed, signed compatible active build admitted, restore reclosed
    the edge, and only the compatible build reopened it.
17. `DATABASE_URL=... npm run verify:p2b:staging` — **PASS** against both the
    source disposable database and a `pg_dump`/`pg_restore` copy. Nginx returned
    `503` while closed, proxied the actual grounded route only after signed
    admission, and returned to `503` for the restore barrier. Final dump SHA-256:
    `f9a15f6654d240bd640c09dae4d2c4a7c2d1d312d6de2ce6d1fb367d4eb704b1`.

## Application boundary integrated

`instrumentation.ts` now enforces exact contract/build admission at startup and
initializes process-global Prisma clients for the four login roles so startup
instrumentation and separately bundled routes share the same exact-role
registry. The website bot
factual branch fails closed when canonical mode is required, requires canonical
entry IDs, requires the exact outbound answer to equal the ordered canonical
answer text in the locked manifest, records its SHA-256 and entry IDs, and has
PostgreSQL independently recheck that binding before `DELIVERED`. It creates a caller-bound guest session only through a SECURITY DEFINER
routine, records the exact eligible publication manifest, holds the property
eligibility row across delivery acceptance, and records an append-only outcome.
The tenant transaction commits the canonical conversation mapping before the
web-role delivery transaction, while delivery still completes before the HTTP
response crosses the network boundary. Legacy fact fallback is forbidden in
canonical mode. Non-factual handover and
safety responses do not assert canonical evidence.

## V5 finding decisions and behavioral trace

| Finding | Decision / enforcement | Current evidence |
| --- | --- | --- |
| V5-1 consent trigger field | Closed in corrected table-specific trigger; exact source identity comparison; legitimate revocation transition supported | Forged identity mutation denial and source revocation PASS |
| V5-2 full claim manifest/evidence | Complete value, answer, qualifiers, components and bindings are sealed under locks | Incomplete/full sealing and sealed-evidence mutation fixtures PASS |
| V5-3 exact publication authorization | Authorization scope hash must equal computed publication manifest | Exact and near-miss authorization fixtures PASS |
| V5-4 sealed-row reassignment | Composite FKs plus sealed evidence/membership triggers | Role reparent test plus evidence/seal and membership/seal race fixtures PASS |
| V5-5 role context | Exact `session_user`, property, principal and purpose grant | PostgreSQL role suite PASS |
| V5-6 file backfill | Deterministic inventory, parity checks, quarantine for unverified bytes/authority | Dry-run and commit rehearsal PASS |
| V5-7 old-build admission | Startup contract/build equality plus signed edge admission | Startup false-ID/old-contract and real local nginx signature/old-build matrix PASS |
| V5-8 delivery checks | Pending audit commits before provider I/O; eligibility is locked through a narrow SECURITY DEFINER manifest routine; failure is persisted in a separate transaction | Timeout, accepted-send/commit-failure, duplicate-key, revocation-race, five-source HTTP and actual Next.js route PASS |
| V5-9 restore compatibility | Explicit baseline + migration and exact normalized schema restore | Restored database plus closed-edge/admitted-build actual route PASS |

## Post-review release blockers

1. Fail-open admission residue — **CLOSED**. Admission verifies the signed
   candidate is the active deployed release, loads the closed state first, and
   installs an EXIT/signal rollback that restores and reloads the closed state
   if validation or reload fails. Real-nginx mismatch and forced-reload-failure
   fixtures pass.
2. Exact answer/evidence binding — **CLOSED**. The locked selected manifest now
   includes the sealed answer text. The sole delivery boundary rejects any byte
   mismatch before provider I/O, and the outcome routine independently verifies
   answer text, SHA-256 and ordered manifest entry IDs before accepting
   `DELIVERED`. Application, negative and forged-binding PostgreSQL fixtures pass.

## Production approval gate

Production backup, rollout, monitoring, rollback and real-customer route checks
are **NOT RUN**. They require the separately mandated production approval and
must begin with the factual edge closed. The local release candidate does not
claim production readiness before that approval and execution.

All migration, deployment, tenant, publication, purge, automatic
`TRIAL_VERIFIED`, and production gates remain held.

## Environment boundary

All passing edge evidence used a real disposable nginx process, locally
generated test signing key, built Next.js server and disposable PostgreSQL.
It is release rehearsal evidence, not evidence about the production host,
production signing key, production data or customer traffic.
