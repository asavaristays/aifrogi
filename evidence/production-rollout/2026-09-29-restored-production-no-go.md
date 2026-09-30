# P2-B restored-production rehearsal: NO-GO

Date: 2026-09-29 (UTC deployment window)
Change ID: `CHG-P2B-V6-20260929`
Production deployment: **NOT PERFORMED**

## Result

The encrypted production backup restored successfully into an isolated
PostgreSQL 14.24 container. The packaged P2-B migration then failed under
`psql -v ON_ERROR_STOP=1 -1` and PostgreSQL rolled the migration transaction
back.

Failure:

```text
ERROR: type "WebsiteSourceConsentStatus" already exists
```

The existing production type has the same labels as the proposed type:
`TRIAL_AUTHORIZED`, `POST_TRIAL_APPROVED`, and `REVOKED`. Production also
already contains a `WebsiteSourceConsent` table with one preserved row, while
the packaged migration unconditionally recreates both the type and table.
This makes the reviewed migration incompatible with the actual production
starting state.

## Verified safety state

- Production database migration: **NOT RUN**
- Production application deployment: **NOT RUN**
- Production nginx admission change: **NOT RUN**
- Production canonical tables created: **0**
- Restored rehearsal canonical migration rolled back: **PASS**
- Existing production backup preserved at the root-only backup location
- Factual release admission was not opened

## Artifact evidence

- Release candidate SHA-256:
  `399544afe5bf1fc55c8e94a179205d69b230296d37156865531aa1d19fe710a6`
- Operations handoff SHA-256:
  `d85c10de13671f85951fa59f21f4feb3239946226fe7c033cb31d45deb35104d`
- Migration SHA-256:
  `f8adfc2301eaa19158d6846fec8802ffb2961a03b56a29522610225e0f74f347`
- Encrypted production backup SHA-256:
  `1978ef4fdecf68291c1b7c6ce98bee6eceea4a0357e3a06cb502cb62093a3afb`
- Production knowledge-document summary: 2 rows, 58,008 declared and stored
  bytes, 0 null-content rows
- External filesystem knowledge inventory: empty; packaged header-only
  inventory retained for the rehearsal

Detailed command output, catalog captures, SQL hashes, and the migration log
are stored in the root-only VPS evidence directory:
`/root/aifrogi-p2b-v6-rollout-20260929/evidence/CHG-P2B-V6-20260929`.

## Required correction

Create and review a production-compatible migration that preserves and upgrades
the existing `WebsiteSourceConsent` type, table, and row instead of attempting
to recreate them. Rebuild and checksum the release candidate, then rerun the
restored-production migration, backfill, catalogs, behavioral tests, application
startup, and rollback rehearsal. Production remains held until that complete
rehearsal passes.
