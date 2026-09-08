# Google callback correction — 2026-09-06

- Cause: callback status redirects used the internal request origin behind the reverse proxy, producing localhost:3011 URLs.
- Correction: return URLs use the configured OAuth callback origin (public AiFrogi fallback), rejecting cross-origin return destinations.
- Local focused Bucket 4 regression: 20/20 passed, including localhost callback coverage.
- VPS staging build passed; release bucket4-redirect-20260906 deployed and readiness verified at 2026-09-06T00:03:33.560Z.
- Rollback: /var/backups/aifrogi/bucket4-redirect-20260906.A4nK30.
- Calendar and Sheets APIs observed enabled in Google Cloud. OAuth credentials configured without displaying secrets.
- Pending: fresh consent flow, successful resource creation and live booking verification. This deployment does not certify the connector or complete Bucket 4.
