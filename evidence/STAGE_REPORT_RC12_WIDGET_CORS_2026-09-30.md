# RC12 registered-origin widget CORS deployment

Date: 2026-09-30  
Target: AiFrogi production application only  
Decision: **DEPLOYED AND VERIFIED**

## Release

- Release: `p2b-v6-20260930-rc12`
- Application commit: `cf8adf92513e837bb4584302840807b044344c6f`
- Archive SHA-256: `d3b06cdc5ee0bb3ae42213bd1c085e849458cb6037f5adf52886378e03bf6c17`
- Rollback: `/var/www/lead-os-ai.rollback-rc11-20260930T090903Z`

## Result

The website-widget installation endpoint now resolves the owning organization's
registered website inside the public-bot tenant context. It grants CORS only
when the browser `Origin` exactly equals that registered website origin.

| Check | Result |
|---|---|
| TypeScript | PASS |
| Focused registered-origin tests | PASS — 3/3 |
| Channel suite | PASS — 289/289 |
| Production build | PASS |
| Signed release admission | PASS |
| Readiness | PASS |
| Allowed preflight | PASS — `204` |
| Allowed origin | PASS — exact registered origin |
| Allowed methods | PASS — `POST, OPTIONS` |
| Allowed headers | PASS — `Content-Type` |
| Hostile origin | PASS — `403`, no CORS grant |
| Valid installation POST | PASS — `200`, `LIVE`, appearance present |

The request body origin must also match the browser `Origin`, preventing a
caller from presenting a permitted origin only in JSON. No wildcard CORS
policy was added.

No Webtechnosys website files, deployment, configuration, or project data were
opened or changed during this correction. All implementation and deployment
changes were confined to AiFrogi.
