# AiFrogi Penetration Test — Rules of Engagement

## Scope

Use a dedicated staging deployment with two synthetic tenants. Cover authentication, session handling, horizontal and vertical authorization, public bot APIs, tenant setup APIs, file upload, connectors, webhooks, payment verification, rate limits and secret exposure. Test OWASP ASVS/API Security risks and business-logic abuse.

## Required scenarios

1. Tenant A attempts to read or mutate Tenant B identifiers.
2. Viewer/Agent attempts Owner/Admin and Super Admin actions.
3. Revoked or expired connector credential attempts a read/write.
4. Forged, replayed and duplicate webhook events.
5. Payment signature, tenant, amount, currency and status mismatch.
6. Prompt/knowledge upload containing credentials or cross-tenant instructions.
7. Session theft, fixation, expiry and revocation behavior.
8. SSRF, path traversal, unsafe redirect, oversized upload and rate-limit abuse.

## Safety boundary

No production testing, denial of service, persistence, employee social engineering, physical testing, real payment capture, destructive deletion or access to genuine customer data without a separately signed authorization. Report evidence through the agreed encrypted channel; never place secrets in screenshots.

## Deliverables and closure

The independent assessor supplies severity-rated findings, reproduction steps, affected control and retest result. Critical/high findings block launch for the affected surface. AiFrogi records owner, remediation commit, deployment, retest and acceptance; only the assessor may mark an external finding independently closed.
