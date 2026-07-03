# AiFrogi Incident Response

Owner: AiFrogi Super Admin

Contact: info@aifrogi.com

Review cadence: quarterly and after every material incident

## Severity

- SEV-1: platform unavailable, cross-tenant exposure risk, unauthorized access, or live messaging broadly stopped.
- SEV-2: one or more customers materially blocked, campaign delivery impaired, or automation queue accumulating.
- SEV-3: degraded non-critical feature with a workaround.
- SEV-4: cosmetic defect or low-risk operational question.

## First 15 Minutes

1. Confirm `/api/health/live` and `/api/health/ready` from outside the server.
2. Check PM2 status, application logs, database reachability, disk, memory, certificate, and recent deployment.
3. Open a Platform Incident in Super Admin with severity, category, customer impact, and current owner.
4. Pause only the affected campaign or automation workflow when possible; keep Inbox and inbound webhooks available.
5. Preserve logs and identifiers. Never paste tokens, OTPs, passwords, message bodies, or contact exports into public channels.

## Customer Communication

- SEV-1: acknowledge within 30 minutes and update at least hourly.
- SEV-2: acknowledge within 2 business hours and update when diagnosis or mitigation changes.
- State the customer impact, what remains operational, the workaround, and the next update time.
- Do not attribute a failure to Meta until API evidence supports that conclusion.

## Recovery

1. Prefer forward fixes or a known-good deployment artifact.
2. Verify readiness, login, Inbox, inbound webhook receipt, one approved test send, campaign guardrails, and automation queue health.
3. Monitor for at least 30 minutes before resolving the incident.
4. Record the resolution and evidence in the Platform Incident and audit trail.

## Post-Incident

For SEV-1 and SEV-2, write a review within two business days: timeline, root cause, contributing controls, detection gap, customer impact, corrective owner, and due date. Update this runbook or a launch check when recurrence can be prevented.
