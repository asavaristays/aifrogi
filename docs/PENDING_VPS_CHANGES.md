# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Operations · bounded storage maintenance

- Add a dry-run-first maintenance command for independent rollback, database-backup, temporary-artifact, cache and PM2-log retention.
- Add a daily systemd timer and persistent audit log.
- Files: `ops/aifrogi-storage-maintenance.sh`, `ops/systemd/aifrogi-storage-maintenance.service`, `ops/systemd/aifrogi-storage-maintenance.timer`.
