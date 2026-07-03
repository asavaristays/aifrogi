# AiFrogi Product Memory: Deployment Source of Truth

Date: 3 July 2026

## Current Production Identity

- Customer-facing product brand: `AiFrogi`.
- Public marketing site: `https://aifrogi.com`.
- Authenticated application: `https://app.aifrogi.com`.
- Production VPS application directory: `/var/www/lead-os-ai`.
- Production PM2 process: `lead-os-ai`.
- Production application port: `3011`.
- Local development workspace: `/Users/manishpurohit/Documents/lead-os-ai`.
- GitHub repository: `asavaristays/aifrogi`.

## Important Compatibility Note

`lead-os-ai` is now a legacy technical name only. It remains in the server path, local folder path, PM2 process name, selected environment variables, and some internal operator IDs for compatibility.

Do not treat `lead-os-ai` or `LeadOS` as the public product name. New UI copy, sales material, support content, onboarding content, legal pages, and customer communications should use `AiFrogi`.

## Deployment Rule

The production directory `/var/www/lead-os-ai` is not a Git checkout. Do not assume that `git pull` on the server will deploy changes.

The current safe deploy flow is:

1. Commit and push the intended source on local `main`.
2. Upload the committed tree to `/var/www/lead-os-ai`.
3. Run `npm run build` on the server.
4. Restart `pm2` process `lead-os-ai`.
5. Verify `https://app.aifrogi.com/api/health/ready`.
6. Verify customer-visible pages on `https://aifrogi.com` and `https://app.aifrogi.com`.

## Avoid These Mistakes

- Do not deploy to a new `/var/www/aifrogi` directory unless Nginx and PM2 have also been migrated in the same maintenance window.
- Do not change `LEADOS_*` environment variable names casually. They are compatibility keys and may be referenced by production secrets, webhooks, or integrations.
- Do not redirect or reconfigure unrelated HotelRadar services as part of AiFrogi work.
- Do not publish `LeadOS` in visible product copy unless documenting historical context.

## Future Cleanup Plan

If a clean technical rename becomes necessary, handle it as a separate infrastructure migration:

1. Create `/var/www/aifrogi` as the new release directory.
2. Copy production `.env*` files securely.
3. Build from the same committed Git revision.
4. Start a new PM2 process named `aifrogi` on port `3011` or a planned replacement port.
5. Update Nginx only after health checks pass.
6. Keep `/var/www/lead-os-ai` as rollback until the new process is stable.
7. Migrate environment variable names only after webhooks, login, Meta callbacks, media URLs, and scheduled jobs are verified.

Until that migration is explicitly approved, `/var/www/lead-os-ai` and PM2 `lead-os-ai` remain the correct production technical targets.
