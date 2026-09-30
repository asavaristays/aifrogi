# P2-B production deployment result

Date: 2026-09-29
Change: `CHG-P2B-V6-20260929`
Outcome: **DEPLOYED — RESTRICTED CANARY OPEN**

## Active release

- Release ID: `p2b-v6-20260929-rc4`
- Signed archive SHA-256:
  `d5112d8011dee9fc272094bb20cc29714c8f04891c07be9405953d6a57861e98`
- Serving contract: `1`
- Production readiness health: `200`
- Previous application retained at:
  `/var/www/lead-os-ai.pre-p2b-v6-20260929-rc4`

## Database and backfill

- Encrypted change-window backup SHA-256:
  `886a3460243df0310aa3a2d6932a2c1fe381c1346c502f61482b004a766c94ed`
- Corrected migration: **PASS** in one transaction on restored production and
  production.
- Backfill dry-run: **PASS**, rolled back.
- Backfill commit: **PASS**.
- Legacy entries mapped: `173`.
- Database knowledge artifacts quarantined: `2`.
- Filesystem artifacts: `0`.
- Serving pointers created by backfill: `0`.
- Legacy entries sealed by backfill: `0`.
- Existing consent rows preserved: `1`.

## Behavioral evidence

- Runtime role/RLS and append-only boundaries: **PASS 7/7**.
- Durable and exact-answer delivery: **PASS 6/6**.
- Claim, publication, pointer, revocation, lease and finalization: **PASS
  13/13**.
- Concurrent sealing races: **PASS 2/2**.
- Form, PDF, spreadsheet, website and failed-website fallback journeys:
  **PASS 6/6**.
- Actual built Next.js factual route: **PASS** with durable delivery audit.
- TypeScript: **PASS**.
- Next.js production build: **PASS**, 98 generated pages/routes.
- Migrated-database dump and restore: **PASS**.

## Edge state

- Signed admission: **PASS**.
- Canary allowlist: `59.184.119.151/32` and localhost only.
- Cloudflare trusted proxy ranges use `CF-Connecting-IP`; an untrusted spoofed
  header remains blocked.
- Authorized public canary reached the application and returned application
  JSON (`401`) for an intentionally invalid visitor session.
- Non-allowlisted origin request returned nginx `503`.
- Expansion beyond the named canary: **NOT RUN / NOT APPROVED**.
- Valid customer-session factual answer through the production public route:
  **NOT RUN**; this is the next real test.

## Evidence locations

Root-only command logs, pre/post catalogs, schema exports, hashes and backfill
results are retained on the VPS under:

`/root/aifrogi-p2b-v6-rollout-20260929/evidence/CHG-P2B-V6-20260929`

Production backup:

`/var/backups/aifrogi/p2b-v6-production-window/aifrogi-20260929T065731Z.dump.gz.enc`
