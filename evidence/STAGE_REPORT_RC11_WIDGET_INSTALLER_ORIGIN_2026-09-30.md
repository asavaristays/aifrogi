# RC11 widget installer origin deployment

Date: 2026-09-30  
Target: AiFrogi production application only  
Decision: **DEPLOYED AND VERIFIED**

## Release

- Release: `p2b-v6-20260930-rc11`
- Application commit: `e13a2d827e4bdc0a47064d5d1e8592e510be1a39`
- Archive SHA-256: `27a0587cecf7a638fb84181cca4e0be3629805c20b5848740cb94b88e7289a63`
- Rollback: `/var/www/lead-os-ai.rollback-rc10-20260930T085017Z`

## Verification

| Check | Result |
|---|---|
| TypeScript | PASS |
| Installer and lifecycle tests | PASS — 22/22 |
| Production build | PASS |
| Temporary-port smoke | PASS |
| Signed admission | PASS |
| PM2 | online |
| Readiness | PASS |
| Live installer HTTP | 200 |
| Production POST callback URL | PRESENT |
| Production iframe URL | PRESENT |
| `localhost:3011` or `127.0.0.1:3011` in returned installer | 0 occurrences |

The Setup UI generates installation code rooted at `https://app.aifrogi.com`. The returned installer independently resolves its callback and iframe to the configured public application origin and fails over to `https://app.aifrogi.com` in production rather than trusting a reverse-proxy internal request URL.

No Webtechnosys website files or configuration were changed in this deployment.
