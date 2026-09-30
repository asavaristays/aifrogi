# P2-B v6 SQL gate evidence

Date: 29 September 2026. Target: local disposable PostgreSQL 14-compatible
cluster, database `aifrogi_p2b_rehearsal`. Production was not contacted.

## Corrections found by execution

1. Original Part 3 failed at `WebsiteSourceConsent` because it was generated
   from an uncommitted prerequisite schema rather than repository base
   `99fb911ab008d92d91bf6f66c9f9cb5033f4e657`.
2. After regenerating Part 3 from that base, Part 15 duplicated structures.
   Those definitions now exist once in Part 3; Part 15 contains enforcement.
3. Part 3 omitted definitions for `current_organization_id` and
   `has_platform_authority`; they are now included before policy creation.
4. Part 5 used unsupported `\error` and non-interpolating `\copy` syntax. It
   now fails naturally on missing required variables and uses SQL `COPY` with
   an explicitly supplied absolute inventory path.

The exact changes are retained as `part-03-corrections.diff`,
`part-15-corrections.diff`, and `part-05-corrections.diff`.

## Commands and results

- `npx prisma db push` against the disposable database: PASS as rehearsal-only
  baseline evidence.
- `psql -v ON_ERROR_STOP=1 -1 -f 03-PROPOSED-DDL.sql`: PASS after correction.
- `psql -v ON_ERROR_STOP=1 -1 -f 15-V6-BLOCKING-HARDENING.sql`: PASS.
- Part 5 with `commit_backfill=false`: PASS; parity notice emitted; rollback
  left zero migration decisions.
- Part 5 with `commit_backfill=true`: PASS; one legacy entry mapped and one
  retained document durably classified `QUARANTINE / NO_EXACT_AUTHORIZED_SOURCE`.

## Current hashes

- Part 3: `72b44ff9d7bac837718364d0a12c4ce2150085cd20bbc8815444e0bd2f385e48`
- Part 15: `4329000a1e81da9eacffdd1c54418922739800fe060134a092dd781378358038`
- Part 5: `e909cf4ee505b251de7443969237df0677350cf03aefdcc49159ea3cc5071e53`
- Reproducible baseline: `a149e4008efae6e39012183f6c3ca41978a0458080b74317c62752fb4c028e58`
- Runtime roles: `857b511a0ab12189ba5eee5789e123ab273b92900550b44941a92e64cf97cee1`
- Combined migration: `f8adfc2301eaa19158d6846fec8802ffb2961a03b56a29522610225e0f74f347`

These are the final hashes at this gate. The historical first migration still
cannot bootstrap an empty database; the explicit baseline plus v6 migration is
therefore the only tested release candidate procedure. It is not yet approved
for production.
