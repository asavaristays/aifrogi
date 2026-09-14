# ISO 27001 / SOC 2 Readiness Register

This register supports readiness; it is not a certification claim.

| Domain | Current evidence | Owner | Cadence | Status |
| --- | --- | --- | --- | --- |
| Governance and risk | Security roadmap, change ledger, release gates | Founder / Security owner | Quarterly | Operating |
| Asset and data inventory | Tenant, connector, credential and backup schema | Engineering | Quarterly | Operating |
| Access control | Roles, privileged OTP, sessions and revocation | Engineering | Monthly review | Operating |
| Cryptography | Independent field key, AES-GCM rotation, encrypted backups | Engineering | Annual/key event | Operating |
| Secure development | CI tests, dependency audit, secret scan, review gate | Engineering | Every change | Operating |
| Supplier management | OpenAI/payment/connector responsibility boundaries | Founder | Annual/change | Evidence collection |
| Incident response | Severity/SLA runbook and security drill | Operations | Quarterly | Operating |
| Continuity | Daily backup, weekly restore drill and rollback artifacts | Operations | Daily/weekly | Operating |
| Privacy lifecycle | Consent, retention and deletion procedures | Privacy owner | Quarterly | Operating |
| Vulnerability management | Weekly dependency scan; external penetration test scope | Engineering | Weekly/annual | External test pending |
| Audit evidence | Platform audit log and sanitized drill/release reports | Operations | Continuous | Operating |
| Formal assurance | Accredited audit and observation period | External auditor | Commercially scheduled | Not certified |

## Dependency exception SEC-DEP-001

The current audit has no critical finding after upgrading and pinning Next.js 16.3.5 and Nodemailer 10.0.9. Remaining high findings are transitive dependencies of the Prisma schema/migration CLI and are not loaded by the deployed application runtime. npm proposes a breaking Prisma downgrade rather than a compatible remediation. CI permits only this named non-runtime chain; any high/critical finding outside it blocks the build. Review by 14 October 2026 or immediately when Prisma publishes a compatible fix.

## Next evidence period

Retain three months of access reviews, change approvals, security-monitor results, restore drills, incident exercises, dependency remediation and supplier reviews. Then commission a formal gap assessment and choose ISO 27001, SOC 2, or both based on target-client requirements.
