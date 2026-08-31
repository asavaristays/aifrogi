# Intelligence Evidence Pipeline migration ownership incident

Date: 2026-08-31  
Release: `30bd5d2`  
Customer impact: none  
Data loss: none

## Summary

The first Prisma migration attempt was rejected by PostgreSQL before schema modification because the runtime role `leados_app` did not own `SovereignAnswerEvidence`. The table owner was `postgres`. This was pre-existing production role-provisioning drift: the application role correctly held data privileges, but the deployment path incorrectly assumed those privileges included schema ownership.

## Verified sequence

1. A dedicated backup-encryption secret was generated directly in protected VPS process memory and persisted in root-protected PM2 state without being displayed.
2. The encrypted PostgreSQL backup was created.
3. **Before the first migration attempt**, its checksum was verified, it was trial-decrypted in a mode-0600 temporary file, and `pg_restore --list` successfully parsed the decrypted archive. Temporary plaintext files were removed.
4. A pre-release code rollback archive was created.
5. The runtime-role migration attempt failed with PostgreSQL `42501 must be owner`; the application was not restarted.
6. Read-only inspection confirmed zero new evidence columns and no replay table, proving no partial schema change.
7. The failed Prisma record was marked rolled back.
8. The additive SQL was applied as the existing table owner, `postgres`.
9. `leados_app` received the same least-privilege table permissions on `SovereignReplayCase` as on the existing evidence ledger.
10. Prisma history was marked applied, the application was built and restarted, and live/ready health passed.

## Root cause

The production schema is owned by `postgres`, while normal application access uses `leados_app`. The prior deployment process ran `prisma migrate deploy` using the application credential without an ownership preflight. Data privileges do not authorize `ALTER TABLE`.

## Corrective action

- Added `ops/preflight-schema-migration.mjs`.
- The gate verifies that backup encryption is configured, identifies the runtime role and target-table owners, and selects either `RUNTIME_OWNER`, `ADMIN_OWNER_REQUIRED`, or `BLOCKED` before migration.
- Unknown, missing or mixed ownership blocks the deployment.
- Administrator execution remains explicit; the gate never elevates the runtime application role.

## Rollback capability

- Verified encrypted database backup retained under `/var/backups/aifrogi`.
- Code rollback snapshot retained as `/var/backups/aifrogi/pre-30bd5d2-code.tar.gz`.
- Pipeline schema is additive; the preceding application release can run while ignoring the new objects.
- Destructive schema rollback is not the default response.
