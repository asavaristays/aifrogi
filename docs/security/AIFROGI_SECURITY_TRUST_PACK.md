# AiFrogi Security & Trust Pack

Version: SEC-005 / 14 September 2026  
Scope: AiFrogi AI Business Bot controlled-pilot platform

## Executive assurance

AiFrogi uses tenant-scoped workspaces, server-side role enforcement, AES-256-GCM credential encryption, signed provider verification, audited administrative actions, encrypted backups and release gates. Claims apply to the documented and tested controls; AiFrogi does not claim ISO 27001, SOC 2 or PCI-DSS certification.

## Client-verifiable controls

| Control | Implementation | Evidence available without exposing customer data |
| --- | --- | --- |
| Tenant isolation | Organization-bound server queries and signed tenant visitor sessions | Two-tenant negative-access test report |
| Privileged access | Owner/Admin role gates and email OTP | Authentication and role-refusal test report |
| Credential protection | AES-256-GCM at rest; secrets not returned after save | Rotation/revocation demonstration and client-bundle scan |
| Connector governance | HTTPS allowlist rules, health checks, expiry/revocation and emergency disable | Connector lifecycle audit record |
| Payments | Provider signature, tenant, order, amount, currency and captured-status verification | Tampered-signature negative test; no card/UPI PIN/OTP collection |
| Release safety | Core 30-question bank, every-live-tenant Golden bank and SEC-001 gate | Dated promotion output |
| Recovery | Encrypted daily backup and scheduled restore drill | Sanitized backup checksum and restore result |
| Accountability | Tenant-bound platform audit records | Sanitized sample audit chronology |

## Safe customer test process

Testing uses two dedicated staging tenants and synthetic records. The assessor may test unauthenticated access, role bypass, cross-tenant identifiers, revoked credentials, forged webhooks, duplicate provider events, payment mismatch and rate limiting. Production credentials, encryption keys, raw customer logs and other tenants' data are never supplied.

## Operational commitments

- Security monitoring checks credential expiry, invalid live connectors and repeated failures.
- Critical connector risk fails closed and can disable the affected connector without disabling other tenants.
- SEV-1 events are acknowledged within 30 minutes under the incident runbook.
- Eligible deletion follows identity verification and the published retention/deletion process.
- Security concerns: info@aifrogi.com.

## External assurance status

Independent penetration testing and ISO 27001/SOC 2 certification require an external assessor. AiFrogi provides the rules of engagement, architecture scope, staging accounts, evidence register and remediation workflow; the assessor owns the independent conclusion.
