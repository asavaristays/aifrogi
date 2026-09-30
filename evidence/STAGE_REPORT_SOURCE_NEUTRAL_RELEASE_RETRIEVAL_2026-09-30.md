# Stage report — source-neutral release retrieval

Date: 2026-09-30  
Scope: application implementation; no production mutation

## Implemented

- Added a tenant- and release-scoped evidence contract for website, PDF, spreadsheet, form/profile, and connector sources.
- Added deterministic evidence fusion and question ranking with authority ordering and strict tenant/release/provenance/expiry checks.
- Added stable locator adapters for website chunks, PDF page blocks, spreadsheet rows, and form/profile fields.
- Added an `aifrogi_public` repository query that returns evidence only when the source is in the active release, authorization is current, and evidence is bound to a sealed claim in the current sealed PUBLIC publication.
- Wired the common retrieval path into website-bot answering.
- Made an active multi-source release authoritative; the active website crawl remains only as a compatibility bridge for tenants without one.
- Prevented mixed claim/crawl delivery envelopes. Release-backed answers serve exact canonical claim bytes so PostgreSQL can verify them before delivery.

## Verification

| Check | Result |
|---|---|
| TypeScript (`npm run typecheck`) | PASS |
| P2-B application suite (`npm run verify:p2b:app`) | PASS — 53/53 |
| Production compilation (`npx next build --webpack`) | PASS |
| Default Turbopack build | ENVIRONMENT BLOCKED — workspace denied Turbopack temporary port binding; webpack production build passed |
| Disposable PostgreSQL execution of the new active-release query | NOT RUN — canonical database role URLs are not configured in this checkout |
| Production deployment | NOT RUN |

## Fail-closed boundary

Raw uploaded text is never injected merely because a file exists. It becomes answerable only after release membership, current authorization, evidence-to-claim binding, claim sealing, and publication membership all agree. FORM members without a sealed claim binding are intentionally not served.

## Next gate

Run the repository query and an HTTP answer fixture on disposable PostgreSQL containing one active release with WEBSITE, PDF, SPREADSHEET, and FORM sources. Confirm exact delivery audit success and revocation failure before packaging or deployment.
