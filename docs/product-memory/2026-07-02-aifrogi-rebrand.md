# AiFrogi Product Memory: Brand Transition

Date: 2 July 2026

## Brand Architecture

- **AiFrogi** is the SaaS platform and customer-facing product brand.
- **webtechnosys** is the operating business and verified Meta Tech Provider.
- **HotelRadar AI Agency** is AiFrogi's first client organization and workspace.
- HotelRadar's WhatsApp number, Meta identifiers, templates, campaign assets, knowledge base, automation content, contacts, and messages remain tenant data. They are not AiFrogi platform defaults for future clients.

## Completed Rename

- Product navigation, page metadata, public product copy, admin labels, support labels, onboarding ownership labels, security presentation, and legal presentation now use AiFrogi.
- The application package is named `aifrogi`.
- Product methodology and current section specifications now use AiFrogi terminology.
- HotelRadar remains visible through the workspace switcher and tenant-specific screens.

## Brand System

- The supplied AiFrogi logo and favicon are the product identity assets.
- The interface is white-first, with deep plum (`#2c243b`) for hierarchy and AiFrogi magenta (`#d92bcb`) for primary actions and active navigation.
- Pale plum surfaces support grouping without making the product feel dark or visually heavy.
- WhatsApp green is retained only for WhatsApp identity, live connection, delivery, and success semantics; it is no longer used as the general product accent.
- The public page, application sidebar, shared controls, dashboard, inbox, onboarding, campaigns, setup, support, admin, security, and legal surfaces inherit the AiFrogi palette.

## Compatibility Preserved

The following legacy technical identifiers intentionally remain unchanged until the new domain migration is complete:

- Existing `LEADOS_*` environment variables.
- Existing `leados_*` cookie names, webhook verify-token values, database identifiers, tags, and CSS animation names.
- Existing HotelRadar SSO route names and internal authentication keys.
- Current PM2 process and deployment directory names.

Changing these identifiers now would create avoidable session, webhook, deployment, or credential risk. They are internal compatibility keys and are not displayed as the product brand.

For the current deployment source of truth, use `2026-07-03-aifrogi-deployment-source-of-truth.md`. The important operational point is that production still runs from `/var/www/lead-os-ai` under PM2 process `lead-os-ai`, while the customer-facing brand and domains are AiFrogi.

## Next Domain Migration

### Fixed Migration Scope

- Only the application currently served from `https://lead.hotelradar.in` is being migrated and rebranded as AiFrogi.
- No other HotelRadar service or hostname is included in this migration.
- `hotelradar.in`, `website.hotelradar.in`, `audit.hotelradar.in`, `gpt.hotelradar.in`, `pms.hotelradar.in`, `revenue.hotelradar.in`, Asavari services, and unrelated VPS applications must not be redirected, renamed, redeployed, or reconfigured as part of AiFrogi work.
- `lead.hotelradar.in` remains available as a compatibility endpoint until AiFrogi authentication, Meta callbacks, webhooks, media URLs, and client access have been verified on the new domain.
- `https://aifrogi.com` and `https://www.aifrogi.com` are the public AiFrogi marketing site.
- `https://app.aifrogi.com` is the canonical authenticated application origin and owns the customer-facing AiFrogi login.
- The HotelRadar SSO callback remains available only for legacy compatibility; normal AiFrogi login no longer displays or redirects through HotelRadar.
- During the credential transition, the AiFrogi-owned login validates the existing administrator credential through the central auth service server-to-server. Passwords are not stored or logged by AiFrogi, and the browser remains on `app.aifrogi.com`.
- The canonical platform administrator identity is `admin@aifrogi.com`. Passwords and temporary credentials are never recorded in product memory.
- The canonical public support, privacy, security, terms, and data-deletion contact is `info@aifrogi.com`.
- The AiFrogi Nginx host proxies only the existing application on port `3011`; it does not share or replace any other application process.
- HTTPS is active for `aifrogi.com`, `www.aifrogi.com`, and `app.aifrogi.com` using a certificate issued on 2 July 2026. The current manual DNS certificate expires on 30 September 2026 and requires either manual renewal or a Cloudflare DNS automation hook before expiry.

After `aifrogi.com` DNS, SSL, and email are ready:

1. Add the AiFrogi production and application hostnames.
2. Configure `PUBLIC_BASE_URL`, authentication callbacks, CORS/origin allowlists, webhook URLs, and Meta app domains.
3. Add `support@aifrogi.com`, privacy contact, and transactional sender records.
4. Keep the old HotelRadar application URL as a temporary redirect during migration.
5. Verify inbound messages, outbound messages, template campaigns, media URLs, login/logout, and webhook delivery before switching traffic.
6. Rotate legacy internal names only through a separate compatibility migration if there is a concrete operational benefit.

## Security Rule

No password, token, OTP, private key, or Meta credential belongs in product memory. Existing credentials and tenant data remain unchanged by this brand transition.
