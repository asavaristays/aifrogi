# AiFrogi Resource Version Register

**Owner:** Engineering / Security

**Last reviewed:** 26 September 2026

**Rule:** Update only through an isolated candidate, with compatibility, security, build and rollback evidence. Never use an unreviewed forced downgrade or major upgrade to silence an alert.

## Current production baseline

| Resource | Version / state | Review trigger |
| --- | --- | --- |
| Core release before this package | `0ec6b35` | Every deployment |
| Production Node.js | `20.20.2` | Before framework/Prisma updates |
| Production npm | `10.8.2` | With Node maintenance |
| Next.js | `16.3.5` | Security alert or monthly review |
| React / React DOM | Lockfile-controlled | Security alert or monthly review |
| Prisma CLI / Client / PostgreSQL adapter | `7.6.0` | Compatible security release; Node compatibility required |
| PostgreSQL driver | Lockfile-controlled | Security alert or monthly review |
| PM2 application | `lead-os-ai`, port 3011 | Every deployment |
| Storage maintenance | Daily systemd timer, 03:40 UTC plus randomized delay | Weekly operations review |
| Encrypted backup | Daily | Daily health monitor |
| Restore drill | Scheduled weekly | Every drill result |

## Security-pinned transitive resources

| Package | Required version | Reason |
| --- | --- | --- |
| `@hono/node-server` | `1.19.15` | Fix static-serving traversal/bypass advisories in Prisma tooling |
| `valibot` | `1.4.2` | Fix inherited-property error-path advisory in Prisma tooling |
| `mysql2` | `3.24.4` | Fix authentication downgrade and compressed-protocol DoS advisories in Prisma tooling |
| `uuid` | `11.1.1` | Fix buffer-bounds advisory in the ExcelJS dependency path |

`deepmerge-ts` 7.1.5 remains inside `@prisma/config`. It is covered by `SEC-DEP-001` because npm currently proposes an incompatible Prisma downgrade rather than a compatible remediation. It is configuration/CLI tooling and is not loaded by the deployed application runtime. Recheck on every Prisma release and no later than 14 October 2026.

## Repeatable inventory

Run:

```bash
npm run report:resource-versions
npm outdated --json
npm run verify:dependency-security
```

The version report reads installed direct dependency versions from `package-lock.json` and records active security overrides. `npm outdated` is advisory only; it must not automatically update production packages.

## Update cadence

- Every change: dependency audit, TypeScript, relevant focused tests and production build.
- Weekly: Dependabot/security workflow and review of open security alerts.
- Monthly: direct dependency currency, Node/npm support window and infrastructure version review.
- Quarterly: database, operating system, PM2, proxy, TLS and external-service compatibility review.
- Immediate: critical vulnerability, exploited vulnerability, end-of-support notice or incompatible provider change.

## Deployment evidence required

1. Exact old and new versions.
2. Advisory or operational reason.
3. Node/runtime compatibility.
4. Lockfile and override review.
5. TypeScript, schema validation, security gate and production build.
6. Production-derived isolated stage.
7. Rollback backup and post-restart health verification.
