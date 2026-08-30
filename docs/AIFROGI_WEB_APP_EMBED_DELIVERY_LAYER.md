# Web App / Embed Delivery Layer

Status: enabled

## Ownership boundary

Channel Adapters normalize and transport messages. This delivery layer controls how the same website bot is presented and launched. It does not create a second bot runtime, configuration, knowledge base or maintenance path.

## Delivery surfaces

- Embedded website widget: `/embed/{tenant-slug}`, installed with the tenant installation script.
- Standalone web app: `/bot/{tenant-slug}`, suitable for direct links, QR codes, social profiles and businesses without a website.
- Optional PWA installation through the standalone page's **Add to Home Screen** action.

Both surfaces use the same tenant-scoped conversation API and therefore share conversation history, consent rules, evidence records, answer feedback, human handover and approved knowledge behavior.

## Security controls

- A bot is served only when its tenant profile is eligible and the Website channel is live.
- Tenant identity comes from the server-resolved slug, never from a visitor-supplied organization identifier.
- Visitor sessions remain signed and tenant-bound.
- Manifests are generated per tenant and are not publicly cached.
- No secrets, bot configuration or knowledge content are placed in installation code or the browser manifest.

## Acceptance criteria

1. Embed and standalone routes render the same `WebsiteBotEmbed` runtime.
2. Both surfaces call the same tenant-bound public bot and feedback endpoints.
3. Pausing or deleting the bot disables both surfaces.
4. Admin installation shows script, iframe, WordPress and standalone link options.
5. Standalone links can be shared, encoded into QR codes and added to a supported device home screen.
6. There is no duplicated bot configuration, intelligence or maintenance.
