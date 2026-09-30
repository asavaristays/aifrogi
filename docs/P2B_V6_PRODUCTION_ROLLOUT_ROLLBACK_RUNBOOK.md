# P2-B v6 production rollout and rollback runbook

Status: **REVIEW ONLY — NOT AUTHORIZED FOR EXECUTION**  
Candidate: `AIFROGI_P2B_V6_RELEASE_CANDIDATE_2.zip`  
Candidate SHA-256: `399544afe5bf1fc55c8e94a179205d69b230296d37156865531aa1d19fe710a6`  
Required serving contract: `1`

This runbook stops before production unless the Release Owner, Database Owner,
Security Owner and Customer/Pilot Owner record approval. Factual routes remain
closed from the first production action until every opening condition passes.
No step authorizes deletion, purge, automatic `TRIAL_VERIFIED` publication, or
reuse of recoverably removed customer/demo identities.

## 1. Named roles and evidence record

Assign different people where operationally possible:

| Role | Responsibility |
| --- | --- |
| Release Owner | change window, artifact identity, application and nginx |
| Database Owner | backup, restore drill, migration, catalogs and rollback |
| Security Owner | signing key, runtime roles, RLS/grants, gate admission |
| Pilot Owner | approved property, test questions and edge-opening decision |
| Observer | timestamps, command exit codes, hashes and stop decisions |

Create a root-owned evidence directory named with the approved change ID. Record
UTC start/end time, operators, host identity, current release ID, previous
release ID, database server/version, commands, exit codes and redacted outputs.
Never write DSNs, passwords, signing keys, customer messages or raw personal data
to the evidence directory.

## 2. Hard preconditions

All items must be **PASS** before the window begins:

- RC2 ZIP hash equals the value above and its ZIP integrity test passes.
- The exact Git commit/build input and lockfile are recorded.
- A signed manifest contains one `RELEASE_ID`, contract `1`, and the immutable
  application archive hash.
- `/var/lib/aifrogi/current-release` will be written only after that exact build
  is installed and must contain its `RELEASE_ID` and `RELEASE_SHA256`.
- The four canonical login roles use separate secrets. The application runtime
  DSN is non-owner, non-superuser and `NOBYPASSRLS`; migration credentials are
  not present in the application environment.
- An empty, isolated restore target is available and is provably not production.
- The approved pilot property, owner, test sessions and expected canonical
  answers are recorded. No automatic publication is enabled.
- On-call ownership, monitoring window and rollback decision authority are set.

### Target-specific finalization prerequisite

`05-BACKFILL-AND-ABORT.sql` deliberately rejects every database whose name does
not end in `_p2b_rehearsal`. It is rehearsal evidence and **must not be edited
in place or run against production**. The implemented
`ops/generate-p2b-production-backfill.sh` consumes a mode-0400/0600 approved
target record and emits a checksummed, target-locked wrapper. Generate one
`REHEARSAL` record for the isolated restored database and a separate
`PRODUCTION` record for the live database. Database name, server address and
role may differ. `ops/verify-p2b-backfill-target-pair.sh` requires the same
change ID, Part 5 hash and inventory content hash across both. It preserves Part
5 and deterministically replaces only its rehearsal-name guard with an exact
approved-database guard. The generated wrapper:

1. requires the exact approved target kind, database/server/role and change ID;
2. preserves the same transaction, locks, timeouts, deterministic IDs,
   quarantine defaults and parity/publication aborts as Part 5;
3. snapshots the approved inventory into its private temporary directory,
   verifies that snapshot's SHA-256, and replaces Part 5's server-side `COPY`
   with client-side `\copy` from that exact verified snapshot;
4. verifies the generated wrapper owner/mode and inventory owner/mode, defaults
   to rollback/dry-run and requires a distinct commit approval token;
5. is executed successfully first against the restored production backup; and
6. has its SHA-256 added to the change record.

The generator and disposable behavior are complete. Final generation remains a
release blocker until both approved target records contain their database
name/server/role, change ID, wrapper owner, absolute inventory path/owner/mode/
hash and commit-token hash. Both generated wrappers, their `SHA256SUMS` and the
pair-verification result require independent review before restored-production
rehearsal. This is not an operator discretion item.

## 3. Pre-window rehearsal using a production backup

1. Close no production traffic yet. Create an encrypted production backup with
   `ops/backup-postgres.sh`. Supply the explicit administrative
   `AIFROGI_BACKUP_DATABASE_URL` plus independently approved expected database,
   server address and role values. The script verifies all three through the
   live connection and has no local/root fallback. Record the returned path and
   `.sha256` file.
2. Verify the encrypted checksum and that the decrypted custom dump is readable
   with `pg_restore --list`. The dump must contain both `public` and
   `aifrogi_security`; a public-only dump cannot restore P2-B triggers or RLS
   policies and is **NO-GO**.
3. Restore into a new isolated database using `ops/restore-drill.sh` or
   `ops/verify-postgres-restore.sh`. The target URL must differ from production.
4. Capture pre-migration catalogs from the restored copy: server version,
   extensions, schemas, tables/columns/constraints/indexes/triggers, RLS flags,
   policies, grants, owners, roles/memberships and row counts per property-owned
   table. Run `ops/capture-postgres-security-catalogs.sh` with the restored
   target's expected database/server/role to separately capture owners, RLS,
   grants, roles and memberships. The PostgreSQL catalog ACL export—not the
   information-schema convenience views—is the complete grant inventory and
   must include effective `PUBLIC`, column and default ACLs. Hash every export.
5. Apply `prisma/p2b-baseline/runtime-roles.sql` as the database administrator.
   Apply the combined migration using `psql -v ON_ERROR_STOP=1 -1 -f` so any SQL
   error rolls back the migration transaction.
6. Run the approved production backfill wrapper in rollback mode. Require its
   parity notice and zero committed migration-decision changes.
7. Run it in commit mode only after the Database Owner approves the dry-run
   counts. Require every file/document without independently verified bytes and
   exact current authority to remain `QUARANTINE`.
8. Export and hash the same post-migration catalogs. Run role, RLS, sealing,
   publication, pointer, revocation, lease, race, delivery and exact-answer
   fixtures against the restored copy.
9. Start the exact release build against the restored database with the factual
   edge closed. Prove the old/false build cannot start or be admitted, the
   compatible build starts, and the approved pilot journey works internally.
10. Perform a rollback rehearsal as described in section 7. Record recovery
    duration and data retained. Any failure stops the production change.

Before approval, the Database Owner must sign a restored-production
compatibility record containing: the backup SHA-256; pre/post catalog export
hashes; the human-reviewed catalog diff; migration and backfill wrapper hashes;
their exact exit codes; parity/quarantine counts; PostgreSQL version/extensions;
and every expected versus unexpected schema/policy/grant/ownership change. The
result must be **PASS — production starting state compatible**. Missing evidence,
any unexpected destructive diff, any SQL warning classified as material, or a
nonzero command is **NO-GO**.

## 4. Production change window: contain and back up

1. Record explicit approvals and announce the change window.
2. Write the nginx admission include atomically as:

   ```nginx
   set $aifrogi_release_admitted 0;
   ```

   Run `nginx -t`, reload, and verify every factual route family returns `503`
   while a non-factual health route remains available. If this cannot be proved,
   **STOP**; do not migrate.
3. Pause canonical workers and prevent new factual delivery jobs from being
   acquired. Record the remaining running/leased jobs and wait for bounded
   completion or expiry; do not rewrite fencing tokens manually.
4. Capture the current release directory, environment-variable names (not
   values), nginx configuration, active-release record and database catalogs.
5. Run `ops/backup-postgres.sh`. Verify its checksum, `pg_restore --list`, file
   permissions and off-host/recovery location. Run a new isolated restore drill
   from this exact `.dump.gz.enc` backup; verification must decrypt and then
   gzip-decompress before `pg_restore`. A backup without a passing restore is
   not a rollback.
6. Because the portable dump deliberately uses `--no-owner --no-privileges`,
   run `ops/capture-postgres-security-catalogs.sh` against production with an
   explicit verified target. Store and hash roles, memberships, table/routine
   grants, owners and RLS flags separately. Restoration of those controls is a
   reviewed recovery step; the dump alone is never cited as proof of them.
7. Record pre-migration row counts and immutable publication/pointer hashes.

## 5. Production migration and application installation

1. Keep nginx closed and workers paused.
2. **Starting-state go/no-go:** compare the live pre-migration catalog export to
   the signed pre-migration export from the restored production backup. Normalize
   only documented volatile fields such as timestamps/OIDs. Table, column,
   constraint, index, trigger, extension, policy, RLS, grant, owner, role and
   row-count differences are not automatically ignorable. Require both:
   (a) no unexplained difference in the starting state; and (b) the same
   migration SHA-256 already completed successfully on that restored starting
   state with the reviewed post-migration catalog diff. The Database and
   Security Owners must record **GO**. Otherwise **STOP** before SQL execution.
3. Apply runtime-role creation as database administrator. Verify each canonical
   role is `LOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION
   NOBYPASSRLS` and has no role memberships.
4. Apply the combined migration in one transaction:

   ```sh
   psql "$MIGRATION_DATABASE_URL" -v ON_ERROR_STOP=1 -1 \
     -f prisma/migrations/20260929090000_p2a_v6_canonical_authority/migration.sql
   ```

   `$MIGRATION_DATABASE_URL` is supplied by the approved secret mechanism and
   must never be echoed. On nonzero exit, go directly to section 7.
5. Run the approved production backfill wrapper first in rollback mode. Compare
   counts and classifications with the restored rehearsal. Then obtain the
   Database Owner's recorded commit approval and run the exact same hashed
   wrapper in commit mode.
6. Re-export schema, policy, grant, ownership and role-membership catalogs.
   Require expected hashes/diffs, row-count parity, no serving pointer created by
   backfill, no sealed legacy row, and all unverified artifacts quarantined.
7. Install the immutable application archive in a new release directory. Do not
   modify it after hashing. Point runtime configuration to the four restricted
   canonical DSNs and the non-owner application DSN.
8. Set startup controls:

   ```text
   AIFROGI_CANONICAL_SERVING_REQUIRED=1
   AIFROGI_LEGACY_FACT_FALLBACK=0
   AIFROGI_REQUIRED_SERVING_CONTRACT=1
   AIFROGI_BUILD_ID=<approved-release-id>
   AIFROGI_ADMITTED_RELEASE_ID=<approved-release-id>
   ```

9. Start the candidate on an unexposed/internal upstream. Require live/readiness
   health, exact build ID, database compatibility, restricted `session_user`,
   catalog checks and internal pilot journeys to pass.
10. Only after the installed files and process identity match the signed
   candidate, atomically write `/var/lib/aifrogi/current-release` with the exact
   `RELEASE_ID` and archive `RELEASE_SHA256`.

## 6. Admission, canary and opening

1. Install canary isolation **before** admission:

   - Create root-owned mode file
     `/etc/nginx/conf.d/aifrogi-canary-mode.conf` from
     `ops/p2b-canary-mode-enabled.conf` (`set
     $aifrogi_canary_required 1;`).
   - Create root-owned `/etc/nginx/conf.d/aifrogi-canary-allow-cidrs.conf`
     containing only reviewed nginx `geo` entries in the form
     `<approved-egress-CIDR> 1;`. The documentation CIDRs in the example are
     non-routable and must not be installed.
   - Install the `geo` and canary maps from Part 18 at `http` scope, and include
     both the release-admission and canary-mode files in the factual server.
     `$aifrogi_factual_denied` must be the variable used by the `503` rule.
   - If nginx is behind a proxy/load balancer, configure `real_ip_header` only
     with explicit `set_real_ip_from` trusted proxy CIDRs. Never trust an
     internet-supplied forwarding header directly.
   - Run `nginx -t`, reload, then prove both an allowlisted and a non-allowlisted
     source receive `503` while release admission is closed.

2. Run `ops/p2b-deployment-admission.sh` as root with the immutable archive,
   signed manifest, signature, public key, required contract, active-release
   file, nginx include and nginx configuration paths explicitly supplied.
3. The script must first reload the closed state, verify signature/hash/contract
   and active-release identity, then test and reload the open state. Any nonzero
   exit is a failed rollout: confirm the include contains `0`, confirm factual
   routes return `503`, and enter rollback/diagnosis.
4. **Post-admission isolation test:** from an approved source, require the
   factual canary request to reach the application. From a non-allowlisted
   source, require the same request to return `503`. From that non-allowlisted
   source, require a designated non-factual health/public route to remain
   reachable. Record source addresses, status codes and nginx access records.
   `npm run verify:p2b:canary` is the local real-nginx regression for this exact
   state transition; production evidence must use the actual trusted addresses.
5. With the external factual edge still restricted, run the real pilot
   journeys: form-only, PDF, spreadsheet, optional
   website, and failed website capture falling back to another authorized
   source. Confirm exact answer binding and durable audit/outcome rows.
6. Run negative checks: cross-property access, forged role/context, stale
   pointer, revoked source, duplicate key and old/false build admission. No
   negative request may create `DELIVERED`.
7. Confirm monitoring for HTTP 5xx/latency, PostgreSQL errors/locks, failed or
   uncertain deliveries, eligibility-generation changes, source revocations,
   job lease expiry/reclaim, RLS denials and handover health.
8. The Release, Database, Security and Pilot Owners review the evidence and
   jointly record **OPEN** or **HOLD**. Only **OPEN** permits ordinary pilot
   traffic from the allowlist. Expansion beyond the named pilot requires another
   approval, atomic installation of `ops/p2b-canary-mode-disabled.conf`,
   `nginx -t`, reload, and verification from both formerly allowed and denied
   sources. Disabling canary mode does not alter signed release admission.

## 7. Rollback and recovery

### Immediate containment triggers

Immediately close the factual edge for any tenant isolation failure,
unauthorized or unbound answer, unexpected publication/pointer change, false
admission, migration/catalog mismatch, repeated uncertain delivery, corrupted
audit chain, or inability to identify the active build.

### Application rollback (preferred)

1. Set the nginx admission include to `0`, test, reload and prove factual `503`.
2. Pause workers. Preserve logs, catalogs and audit rows; do not purge evidence.
3. Switch the internal upstream to the previous application release only if its
   contract is compatible with the migrated database. An old build is never
   allowed to reopen factual routes.
4. If no compatible previous build exists, keep factual routes closed and run
   non-factual/handover-only service while preparing a forward fix.

The P2-B migration is additive. Do not drop its tables, disable forced RLS,
rewrite sealed rows or reverse backfill during incident response.

### Database recovery (exceptional; separate incident approval)

Use database restoration only for proven corruption that cannot be repaired
forward. Keep the factual edge closed, restore the protected backup into a new
database, verify checksum/catalog/row counts there, connect a compatible build
to it internally, and rerun the restore matrix. Switching production to the
restored database requires the Incident and Database Owners' explicit approval.
Never restore destructively over the only production copy.

### Rollback exit criteria

- factual routes demonstrably return `503`;
- workers cannot acquire new factual jobs;
- the active application/database pair is identified and compatible;
- customer records and audit history remain preserved;
- uncertain provider outcomes are queued for reconciliation, not retried
  blindly; and
- incident evidence and the next decision owner are recorded.

## 8. Post-opening observation and completion

For the approved observation window, record request counts, successful grounded
answers, safe gaps/handoffs, failed and uncertain outcomes, duplicates, RLS
denials, job reclaim events, latency and errors. Manually inspect the approved
pilot sample without exposing personal data in the report.

The rollout is complete only when all owners sign the evidence record, backup
and restore proof is retained, no blocker is open, the rollback target remains
available, and the release report is updated with observed production results.
Until then, production checks remain **IN PROGRESS** rather than `PASS`.

## 9. Local backup/restore control evidence

The packaged scripts were exercised on 29 September 2026 against disposable
PostgreSQL only:

- a deliberately incorrect expected database name was rejected before dump;
- the explicit database, server address and session role were verified before
  the accepted dump;
- a deliberately misleading `?schema=deliberately_wrong` URL parameter could
  not change the fixed `--schema public --schema aifrogi_security` selection;
- the `.dump.gz.enc` checksum passed, then decrypt → gzip decompress →
  `pg_restore --list` → `pg_restore --exit-on-error` completed successfully;
- the restored target contained 107 public tables, 47 `aifrogi_security`
  routines and 43 policies; and
- separate roles, memberships, owners, RLS and effective PostgreSQL catalog
  ACLs were captured and their `SHA256SUMS` verified; the disposable effective
  ACL export included 297 `PUBLIC` rows, plus column and default ACL files.

These are regression results for the scripts, not production backup or restore
evidence. Production must repeat every check with its approved explicit target.

## 10. Local production-wrapper control evidence

The target-locking generator was exercised using disposable approval values:

- separate mode-0600 `REHEARSAL` and `PRODUCTION` records generated distinct
  mode-0500 wrappers and `SHA256SUMS` for different database targets;
- pair verification proved identical change ID, Part 5 hash and inventory hash;
- server comparison used plain `host(inet_server_addr())` values rather than
  CIDR-formatted `inet::text` output;
- wrapper owner/mode and inventory owner/mode checks passed for both targets;
- the wrapper verified the Part 5 and inventory hashes;
- the approved inventory was copied to a private snapshot, that snapshot was
  hashed, and PostgreSQL consumed it through client-side `\copy`; the path whose
  bytes were verified was therefore the path supplied to the copy protocol;
- a different live database identity was rejected before SQL;
- rollback mode on both targets preserved Part 5's transaction and emitted
  `PARITY_PASS` then `P2A_V6_BACKFILL_REHEARSED_AND_ROLLED_BACK`;
- a wrong commit token was rejected before SQL; and
- the approved disposable token emitted `PARITY_PASS` and
  `P2A_V6_BACKFILL_COMMITTED`.

This proves the mechanism, not a production target. The real approved change
record, generated wrapper and restored-production results remain **NOT RUN**.

## 11. Decision record template

```text
Change ID:
Candidate release ID / SHA-256:
Previous release ID:
Backup path / encrypted SHA-256:
Restore drill target / result / duration:
Pre/post catalog export hashes:
Migration SQL SHA-256 / exit code:
Production backfill wrapper SHA-256 / dry-run / commit results:
Runtime session_user and role-shape result:
Startup/build/contract result:
Admission result:
Pilot journey results:
Monitoring observations:
Rollback rehearsal/result:
Open findings:
Decision: HOLD | OPEN PILOT | ROLLBACK
Release Owner / time:
Database Owner / time:
Security Owner / time:
Pilot Owner / time:
```
