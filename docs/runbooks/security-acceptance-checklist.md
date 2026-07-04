# Security Acceptance Checklist

## Purpose

Use this checklist before calling AiFrogi security controls “verified.” It records the difference between controls being built and controls being proven on the covered routes.

Security posture ratings are communication tools, not guarantees. A green run means the covered checks passed; new sensitive endpoints must be added to the verifier to keep the claim true.

## Acceptance target

After this checklist passes, AiFrogi can honestly say:

> AiFrogi enforces customer-controlled support access, tenant isolation, role-gated sensitive actions, and fail-closed Meta webhook security on the covered routes, verified by repeatable tests.

## Prerequisites

- A staging environment or safe test environment.
- Workspace A owner/admin test account.
- Workspace A limited user test account: AGENT or VIEWER.
- Workspace B property slug.
- Access to the production Meta app secret for final production webhook enforcement.

Do not paste passwords, Meta secrets, webhook signatures, or session cookies into tickets, chat, screenshots, or logs.

## Step 1 — Enable Meta webhook enforcement

Follow [Meta webhook enforcement](./meta-webhook-enforcement.md).

Required evidence:

```text
npm run verify:meta-webhook
```

Expected after `META_APP_SECRET` is configured:

```text
metaWebhookSignature: ok
unsigned webhook rejection: 403
```

Then trigger a real Meta-signed webhook event from Meta dashboard or a real inbound WhatsApp message.

Expected:

```text
real Meta-signed webhook: 200
message processed in the correct workspace
```

What this proves:

- The app sees the Meta app secret.
- Unsigned or forged webhook JSON is rejected.
- Real Meta-signed webhook traffic is accepted.

What this does not prove:

- Every non-webhook endpoint is isolated.
- Meta template/content policy compliance.

## Step 2 — Run security boundary verifier

Use [Security boundary verification](./security-boundary-verification.md).

Set staging test credentials:

```bash
export AIFROGI_SECURITY_TEST_BASE_URL="https://staging.example.com"
export AIFROGI_TEST_WORKSPACE_A_ADMIN_USER="owner-a@example.com"
export AIFROGI_TEST_WORKSPACE_A_ADMIN_PASSWORD="..."
export AIFROGI_TEST_WORKSPACE_A_LIMITED_USER="agent-a@example.com"
export AIFROGI_TEST_WORKSPACE_A_LIMITED_PASSWORD="..."
export AIFROGI_TEST_WORKSPACE_B_SLUG="workspace-b-slug"
```

Run:

```bash
npm run verify:security-boundaries
```

Expected:

```text
PASS: Unauthenticated integration read is blocked
PASS: Unauthenticated template send is blocked before any WhatsApp send
PASS: Workspace A admin cannot use Workspace B propertySlug in template endpoint
PASS: Workspace A admin cannot query Workspace B knowledge context by propertySlug
PASS: Limited user cannot run bulk campaign API directly
PASS: Limited user cannot save WhatsApp integration settings
PASS: Limited user cannot run WhatsApp integration test send
PASS: Limited user cannot validate WhatsApp integration
PASS: Limited user cannot refresh knowledge crawl
```

What this proves:

- Covered unauthenticated routes refuse unauthenticated access.
- Covered `propertySlug` spoofing attempts are rejected.
- Covered Owner/Admin actions are refused for the limited user.

What this does not prove:

- Routes not covered by the verifier.
- Future routes added after this run.
- Full mathematical absence of IDOR issues.

## Step 3 — Confirm the verifier can fail

This step is required. A green suite that has never been shown to go red is not fully trusted.

Perform only in staging or a disposable branch/environment.

Recommended realistic break:

1. Temporarily weaken one mutation-path role gate, such as the `requireManage: true` check for:
   - `/api/integrations/whatsapp/bulk-message`, or
   - `/api/integrations/whatsapp/test`, or
   - `/api/integrations/whatsapp` POST.
2. Run:

```bash
npm run verify:security-boundaries
```

Expected:

```text
FAIL: Limited user cannot run bulk campaign API directly
```

or the specific line matching the route you weakened.

3. Confirm the expected line failed, not an unrelated line.
4. Restore the control.
5. Run the verifier again.

Expected:

```text
all covered checks PASS
```

What this proves:

- The verifier catches at least one realistic regression.
- The green board is not caused by a script that always passes.

## Step 4 — Confirm limited user is truly limited

Before accepting the role-gate result, confirm the test account is not accidentally OWNER/ADMIN.

Expected role:

```text
AGENT or VIEWER
```

If the account is OWNER/ADMIN, the role tests are invalid.

## Step 5 — Record acceptance evidence

Record:

- Date and environment.
- Release hash.
- `npm run verify:meta-webhook` result.
- Real Meta test event result.
- `npm run verify:security-boundaries` result.
- Deliberate-failure result and restored green result.
- Confirmation that the limited user role is AGENT/VIEWER.

Do not record secrets, passwords, cookies, or raw webhook signatures.

## Release claim after passing

Allowed:

```text
AiFrogi enforces customer-controlled support access, tenant isolation, role-gated sensitive actions, and fail-closed Meta webhook security on the covered routes, verified by repeatable tests.
```

Avoid:

```text
AiFrogi is fully secure.
AiFrogi has no IDOR risk.
All endpoints are mathematically proven isolated.
```

## Ongoing rule

When adding any sensitive route that accepts or derives:

- `propertySlug`
- `propertyId`
- `organizationId`
- `leadId`
- `conversationId`
- document IDs
- support ticket IDs
- integration IDs

update `npm run verify:security-boundaries` or add a new verifier before release.

