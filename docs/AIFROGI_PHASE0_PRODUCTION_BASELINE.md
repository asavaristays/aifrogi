# AiFrogi Phase 0 Production Baseline

Baseline date: 29 August 2026  
Public brand: AiFrogi  
Production application: `/var/www/lead-os-ai`  
PM2 process: `lead-os-ai` on port `3011`  
GitHub repository: `asavaristays/aifrogi`  
Production tag: `production-baseline-2026-08-29`

## Scope

This baseline reconciles the current running beta before channel-independent backend work begins. It includes the production source, current database schema, backup artifacts, deployment configuration, build results, and rollback instructions.

Local Phase 1 channel-foundation drafts are explicitly excluded from this production baseline.

## Protected backup

The VPS contains a root-only baseline directory:

`/root/aifrogi-phase0-20260829`

It contains:

- `source.tgz`: production source, excluding rebuildable dependencies, `.next`, and Git metadata.
- `database.dump`: full PostgreSQL custom-format backup.
- `schema.sql`: schema-only PostgreSQL export.
- `database-restore-list.txt`: parsed restore catalog proving the dump is readable.
- `migration-history.txt`: migration-history capture result.
- `nginx-aifrogi.com.conf`: active Nginx virtual host.
- `pm2-process.txt`: PM2 process description.
- `production-checksums.txt`: production lockfile and Prisma-schema checksums.
- `backup-checksums.txt`: source, database, and schema backup checksums.

All backup files and the containing directory are restricted to root access.

Validation results:

- Source tar archive listing: pass.
- PostgreSQL custom dump parse through `pg_restore --list`: pass, 346 catalog entries.
- Schema-only export: pass, 2,849 lines.
- SHA-256 checksums: recorded.

## Database state

The production schema includes the current organization, property, lead, lead-message, WhatsApp, knowledge, billing, automation, appointment, and commerce domains.

The production database has no readable `_prisma_migrations` history. The existing schema has been managed outside `prisma migrate`—primarily through schema push/manual evolution.

This is a Phase 1 blocker for deployment, not for local design. Before the first additive migration is deployed:

1. Treat the captured `schema.sql` as the authoritative production schema baseline.
2. Compare the reconciled Prisma schema against the captured database schema.
3. Create and review a Prisma baseline migration.
4. Mark the baseline as applied without replaying destructive DDL against production.
5. Test the first additive migration against a restored copy of `database.dump`.

## Verification baseline

Run from the reconciled GitHub working copy with no production secrets:

| Check | Result |
| --- | --- |
| `npm ci` | Pass; 593 packages installed |
| Dependency audit | 21 reported vulnerabilities: 1 low, 4 moderate, 16 high |
| `npm run db:generate` | Pass with a non-production validation URL |
| `npm run typecheck` | Pass |
| `npm run lint` | Pass with 13 existing warnings and 0 errors |
| `npm run build` | Pass; 80 routes generated |
| `npm run verify:client-secrets` | Pass; 8 server-only markers absent from browser assets |
| VPS `/api/health/ready` | Pass for database, session secret, public URL, Meta signature, and legacy inbound token checks |
| Public route smoke checks | Pass for homepage, core marketing routes, robots, and sitemap |

The repository does not yet have a complete automated framework for channel contracts, tenant isolation, webhook ordering/duplicates, or legacy/new-path parity. Those are Gate 2 requirements before Phase 1 can be enabled.

## Deployment procedure

1. Work from a clean checkout of `asavaristays/aifrogi`.
2. Require typecheck, lint, production build, and client-secret verification to pass.
3. Create a source archive from the committed tree only; exclude `.git`, `.next`, `node_modules`, `.env*`, runtime credentials, and operating-system metadata.
4. Create a fresh root-only source and database backup on the VPS.
5. Upload the committed tree to `/var/www/lead-os-ai` without replacing `.env.local` or other server secrets.
6. Run `npm ci` when the lockfile changes.
7. Run `npm run build` on the VPS.
8. Restart only `lead-os-ai` with PM2.
9. Verify `/api/health/ready`, login, core public routes, and the existing WhatsApp webhook reachability.
10. Record the deployed Git commit and timestamp.

Production must not be deployed from an uncommitted local directory after this baseline.

## Rollback procedure

Application rollback:

1. Disable any new feature flags.
2. Restore the last committed/tagged source or extract the protected `source.tgz` to a staging directory.
3. Preserve the active `.env.local` and runtime secrets.
4. Install the matching lockfile dependencies and rebuild.
5. Replace the application source only after the staged build succeeds.
6. Restart only `lead-os-ai`.
7. Verify readiness, login, webhook reachability, and representative client routes.

Database rollback after future migrations:

1. Stop new writes or place the affected workflow in maintenance mode.
2. Capture a fresh incident-time dump before restoring anything.
3. Restore the protected baseline dump into an isolated database first and run integrity checks.
4. Point a staging application at the restored database and verify critical reads.
5. Restore production only with explicit incident approval.

The current rollback validation confirms that both source and database backup artifacts are readable. A destructive production database restore was intentionally not performed.

## Phase 1 go/no-go

Phase 1 may proceed locally only after this baseline is pushed and tagged. Phase 1 may be deployed only when:

- The production database is baselined under Prisma migration history.
- Channel and tenant-boundary tests pass.
- WhatsApp regression, duplicate, ordering, and compatibility tests pass.
- The feature flag disabled path proves current behavior is unchanged.
- The enabled path proves neutral routing without data loss or duplication.
- Rollback is demonstrated against an isolated database restored from the protected dump.
