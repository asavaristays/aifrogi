# AiFrogi token and storage optimization strategy

## Immediate storage policy

The server must use bounded retention, not age-only cleanup. Frequent releases can fill the disk even when every backup is only one day old.

| Storage class | Automatic retention |
| --- | --- |
| Release rollback directories | Newest 5 |
| PostgreSQL `.dump` backups | Newest 7 |
| Encrypted DB sets, checksums and environment snapshots | Preserve pending restore-tested policy |
| `/var/www/aifrogi-*` build stages | Newest 2 |
| `/tmp` AiFrogi packages/stages | Newest 10 |
| npm and production `.next` build cache | Clear daily |
| Individual PM2 log | Trim only above 25 MB; retain latest 10 MB |

The maintenance command is dry-run by default. The production timer explicitly uses `--apply`, runs daily at 03:40 with a randomized delay, writes a compact summary, and respects a `.keep` marker on protected backups. Set `AIFROGI_VERBOSE=1` only when individual target names are required. The permanent `releases` archive is excluded from the timestamped rollback-directory match.

Run a dry preview with:

```bash
sudo /usr/local/sbin/aifrogi-storage-maintenance --dry-run
```

Emergency rule: investigate at 75% disk use and stop normal deployments at 85% until storage is recovered.

## Codex token policy

1. Keep `docs/PENDING_VPS_CHANGES.md` as the only undeployed-change queue.
2. Batch two or three related changes in one product area.
3. During implementation, run focused checks only; run typecheck and production build once at batch completion.
4. Gather VPS facts in one compact command that reports totals, counts and failures—not complete directory listings.
5. Build one production-based stage, upload only changed files, create one rollback point, restart once and verify once.
6. Use browser inspection only for a changed customer journey; do not repeat unchanged screens.
7. Put durable findings in the daily log so the next Codex session reads the answer instead of rediscovering it.
8. Keep command output concise and record only pass/fail plus actionable errors.

## Current baseline (8 September 2026)

- Root disk: 97 GB total, 63 GB used, 35 GB free (65%).
- AiFrogi backups: 6.0 GB across 57 items.
- Temporary AiFrogi artifacts: 1.2 GB across 175 items.
- Build stages: 1.2 GB across 4 directories.
- PM2 logs: 450 MB.
- npm cache: 729 MB.
- production Next.js build cache: 484 MB.

This policy is expected to recover several gigabytes on its first run, while retaining multiple rollback and database recovery points. The exact reclaimed amount must be reported by the production dry run before cleanup is applied.
