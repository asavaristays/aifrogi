\set ON_ERROR_STOP on
BEGIN;
\ir ../../prisma/migrations/20260929090000_p2a_v6_canonical_authority/migration.sql
SELECT 1/0;
COMMIT;
