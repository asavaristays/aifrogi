# Product Memory: 2026-07-03 Section 07 Commercial Launch

## Decision

Commercial launch is an operating capability, not a marketing event. AiFrogi should not acquire customers faster than it can explain, observe, recover, support, and safely offboard the product.

## Implemented

- Original AiFrogi product film from AiFrogi-owned screens; the competitor reference video was not reused.
- Product tour with captions and static fallback.
- Public task-based Help Center and support integration.
- Accessibility baseline for keyboard focus, skip navigation, reduced motion, contrast, video captions, and failure recovery.
- Liveness and readiness health endpoints.
- Stateful alert script, encrypted backup, checksum, retention, and guarded restore drill.
- Incident, monitoring, backup, and launch QA runbooks.
- Automated `verify:launch` and `verify:all` gates.

## Commercial Guardrails

- Do not expose Meta credentials or technical complexity to customers.
- Do not reuse third-party product footage, logos, watermarks, or music in AiFrogi commercial assets.
- Do not declare launch ready without health, messaging, restore, access-boundary, and critical journey evidence.
- Keep Razorpay deferred until early-customer pricing stabilizes; manual provider-neutral billing remains the source of truth.

## Required External Configuration

- Configure `AIFROGI_ALERT_WEBHOOK_URL` or connect an external uptime service.
- Set `BACKUP_ENCRYPTION_PASSPHRASE` outside Git.
- Replicate encrypted backups off the application VPS.
- Provide a separate non-production PostgreSQL host through `RESTORE_ADMIN_URL` for monthly drills.
