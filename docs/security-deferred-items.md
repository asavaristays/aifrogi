# AiFrogi Deferred Security Items

## Purpose

This note keeps the security posture honest after the July 2026 verification push.

AiFrogi can currently claim the covered controls are verified: customer-controlled support access, covered tenant-isolation paths, covered role-gated sensitive actions, privileged login OTP, and fail-closed Meta webhook signature enforcement.

The items below are not blockers for the current 8.5/10 rating on covered controls. They are the work that prevents the rating from decaying as new routes, customers, integrations, and operators are added.

## Current verified claim

Allowed wording:

```text
AiFrogi enforces customer-controlled support access, tenant isolation, role-gated sensitive actions, privileged login OTP, and fail-closed Meta webhook security on the covered routes, verified by repeatable tests.
```

Keep the qualifier “covered routes.” It is not weakness; it is the accurate boundary of the evidence.

## Deferred items

| Item | Why it matters | When to do it | Evidence that closes it |
| --- | --- | --- | --- |
| Make security verifiers a required CI gate | A verifier that is optional can be skipped during busy releases. Required CI keeps the 8.5 posture from drifting. | Before inviting more external customers or adding new sensitive integrations. | Pull requests touching API/auth/integration routes cannot merge unless `verify:meta-webhook` and the appropriate security-boundary verifier pass in a safe test environment. |
| Expand boundary coverage for every sensitive route | The current suite proves the enumerated routes. New routes accepting IDs or workspace selectors need their own refusal checks. | Every time a route accepts or derives `propertySlug`, `propertyId`, `organizationId`, `leadId`, `conversationId`, document IDs, support ticket IDs, or integration IDs. | The verifier includes the new endpoint and shows unauthenticated, cross-workspace, and role-bypass attempts are refused. |
| Login and OTP rate-limit audit | Login and OTP flows already have rate limits, but they should be reviewed as a formal abuse-control item: password guessing, OTP guessing, resend pressure, and account lockout behavior. | Before broader public signups or paid GA. | Documented limits, tests for repeated password/OTP failures, and clear operator guidance for legitimate lockouts. |
| Client-bundle secret check | Completed 2026-07-05: the release gate scans `.next/static` for eight server-only secret markers after every production build. | Keep in CI and extend when new integrations add secrets. | `npm run verify:client-secrets` passes after `npm run build`. |
| Real Meta-origin webhook smoke test | The signed local test proves crypto enforcement. A real Meta-origin event additionally proves Meta subscription plumbing and payload routing. | Once per Meta app setup and after webhook URL/subscription changes. | Meta dashboard test or real inbound WhatsApp event returns `200`, appears in logs, and routes to the intended workspace without exposing message data in public notes. |
| Support-access reason quality | Support access is customer-controlled. The next trust improvement is making every grant explain why access was needed in plain language. | Before support volume increases beyond founder/operator handling. | Support grant requires a meaningful reason, records scope/duration/actor, and shows the reason in the audit trail. |
| Session/device controls | Customer session visibility and self-revocation completed 2026-07-05. Platform-wide forced logout remains an operator enhancement. | Add Super Admin forced logout before larger multi-user deployments. | Users can view active sessions/devices and revoke them; revoked local sessions fail in the proxy and server auth layer. |
| Backup restore drill evidence | Backups are only trusted after restore is tested. Customer data confidence needs proof that recovery works. | Monthly after first paying customers, and before enterprise sales. | Restore drill date, target, result, duration, and operator notes recorded without customer secrets. |
| External security assessment | Internal verification is strong for beta. External review becomes important as customer count and revenue grow. | Before enterprise positioning, large hotel groups, or regulated customers. | Annual external vulnerability assessment or penetration test report, with remediation notes. |
| SOC 2 / ISO 27001 readiness | Certification is not needed to be honest now, but enterprise buyers may ask for it later. | After product-market validation and stable operating processes. | Gap assessment, policy set, evidence collection process, then certification plan if commercially justified. |

## CI gate rule for future work

Any pull request that changes a sensitive API route should answer:

1. What customer/workspace boundary does this route depend on?
2. Which role can use it?
3. What happens if a user supplies another workspace’s ID or slug?
4. Which verifier line proves the refusal path?

If there is no verifier line, add one before release.

## Optional but useful wording for internal status

```text
Current security posture: 8.5/10 for the covered controls. The score is maintained by required verification, endpoint coverage growth, abuse-control checks, and periodic restore/security evidence.
```

Do not shorten this to “fully secure.” The evidence is strong because the boundary is precise.
