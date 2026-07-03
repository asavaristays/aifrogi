# Section 06: Billing And Super Admin

Status: Planned
Target score: 8.5/10

## Think

Primary users: the client owner responsible for payment and the AiFrogi operator responsible for platform reliability.

Primary job: understand subscription, usage, Meta billing responsibility, customer health, and the exact intervention required without exposing secrets.

## Product Flow

Trial -> Plan selection -> Payment authorization -> Subscription activation -> Usage and limits -> Invoice/reconciliation -> Renewal or failure recovery. Platform signals -> Customer health -> Prioritized operator queue -> Audited intervention -> Resolution.

## Implementation Blocks

1. Plan, subscription, trial, invoice, payment, usage allowance, and adjustment models.
2. Payment-provider integration and verified webhook reconciliation.
3. Entitlement enforcement and graceful read-only/limited states.
4. Clear separation of AiFrogi fees, Meta charges, taxes, AI overage, and services.
5. Customer health score using onboarding, messaging, campaign, automation, support, and billing signals.
6. Super Admin queues for activation blockers, delivery incidents, template failures, billing risk, and knowledge gaps.
7. Visible platform audit trail and carefully controlled customer-assistance sessions.

## Acceptance Gates

- Payment webhooks are authenticated and idempotent.
- Access and plan limits derive from server-side entitlements.
- Failed payment recovery does not lose customer data.
- Invoices, adjustments, and usage are reconcilable.
- Every Super Admin action is authorized and audited.
- Client and platform dashboards remain distinct.

## Achieve Definition

The section is complete when AiFrogi can charge, reconcile, limit, support, and monitor multiple customers without spreadsheets or shared credentials.
