# AiFrogi Meta Provider Security Ladder

AiFrogi handles WhatsApp customer conversations, customer documents, Meta credentials, automation rules, and campaign activity. The security goal is simple: customer data stays inside the customer workspace, support access is customer-controlled, and every sensitive integration action is authenticated, scoped, and auditable.

## Level 1 — Enforced now

- Customer-controlled support access: super admin cannot read private conversations or documents by default. Workspace owners/admins grant time-bound access by scope.
- Workspace-scoped WhatsApp APIs: outbound messages, campaign sends, knowledge previews, integration save, integration validation, and test sends require a signed-in customer workspace account.
- Tenant-safe workspace resolution: submitted `propertySlug` and `propertyId` values are treated as untrusted input. The server resolves the workspace from the authenticated customer membership.
- Campaign control: bulk WhatsApp campaign sends require workspace owner/admin access because they affect consent, Meta billing, and brand risk.
- Meta webhook authenticity: Meta JSON webhooks are validated with `X-Hub-Signature-256` when `META_APP_SECRET` or `FACEBOOK_APP_SECRET` is configured.
- Legacy inbound webhook protection: production inbound capture requires `LEADOS_WHATSAPP_INBOUND_TOKEN` unless deliberately disabled for a non-production environment.
- Credential protection: WhatsApp access tokens and webhook registration secrets are encrypted at rest.
- No-store support endpoints: support-access APIs avoid cached customer access state.

## Level 2 — Next controls to add

- Mandatory MFA for super admin and workspace owners.
- Support reason capture before granting support access, so every grant has a business purpose.
- Session/device management for workspace users: active sessions, revoke session, forced logout.
- Rate limits for outbound message APIs and webhook endpoints.
- Automated tenant-isolation tests covering every API that accepts `propertySlug`, `propertyId`, `organizationId`, `leadId`, or `conversationId`.
- Backup restore drill evidence: monthly restore test, result logged, and owner notified.
- Incident runbook: detection, containment, notification, recovery, and customer communication template.

## Level 3 — Enterprise trust evidence

- Public status page with uptime and incident history.
- Data-processing agreement, subprocessors list, and hosting-region statement.
- Annual external vulnerability assessment or penetration test.
- SOC 2 or ISO 27001 readiness plan, then certification when commercial scale justifies it.
- Security changelog showing customer-visible controls shipped over time.

## Customer-facing confidence statement

AiFrogi is operated by webtechnosys and built for the official WhatsApp Business Platform. Customer data is workspace-scoped. AiFrogi support cannot read private customer content unless a workspace owner/admin grants temporary access for a defined purpose. Meta webhook traffic is verified when the Meta app secret is configured, and outbound WhatsApp actions are allowed only from the customer’s authenticated workspace.

