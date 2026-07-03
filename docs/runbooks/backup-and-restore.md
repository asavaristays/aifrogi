# AiFrogi Backup And Restore

## Policy

- Run an encrypted PostgreSQL backup daily.
- Retain daily backups for 14 days; keep monthly evidence separately when commercial policy requires it.
- Store the encryption passphrase outside the repository and outside the backup directory.
- Replicate encrypted backups to a provider or region separate from the application VPS.
- Run and record a restore drill at least monthly and before material database migrations.

## Backup

Required environment:

```bash
export DATABASE_URL='postgresql://...'
export BACKUP_ENCRYPTION_PASSPHRASE='...'
export AIFROGI_BACKUP_DIR='/var/backups/aifrogi'
./ops/backup-postgres.sh
```

The script creates a PostgreSQL custom-format dump, validates its catalogue, compresses it, encrypts it with AES-256-CBC and PBKDF2, writes a SHA-256 checksum, and removes files older than the retention window.

## Restore Drill

`RESTORE_ADMIN_URL` must point to a non-production PostgreSQL server. The script refuses common production database names and creates a temporary database beginning with `aifrogi_restore_`.

```bash
export RESTORE_ADMIN_URL='postgresql://restore-admin@restore-host/postgres'
export BACKUP_ENCRYPTION_PASSPHRASE='...'
./ops/restore-drill.sh /var/backups/aifrogi/aifrogi-YYYYMMDDTHHMMSSZ.dump.gz.enc
```

Record the backup timestamp, checksum result, restore duration, restored table count, tester, and outcome. The temporary database is dropped automatically.

## Production Recovery

Production recovery requires explicit owner approval. Create a new database, restore into it, validate tenant counts and critical records, place the app in maintenance, switch `DATABASE_URL`, run readiness and launch verification, and only then resume traffic. Never restore over the live database in place.

## Customer Export And Deletion

Export and deletion requests require identity verification and an audit record. Export organization-scoped business data only. Deletion should suspend access, preserve legally required billing evidence, delete organization-owned operational data through relational cascade, and record completion without retaining customer message content.
