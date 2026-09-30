-- psql entry point for an approved disposable P2-B rehearsal only.
\set ON_ERROR_STOP on
BEGIN;
\ir 03-PROPOSED-DDL.sql
\ir 15-V6-BLOCKING-HARDENING.sql
COMMIT;

-- Part 5 owns its rehearsal/commit transaction and requires the caller's
-- migration_batch_id, filesystem_inventory and commit_backfill variables.
\ir 05-BACKFILL-AND-ABORT.sql
