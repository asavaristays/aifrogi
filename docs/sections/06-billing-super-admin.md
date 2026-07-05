# Section 06: Billing And Super Admin

Status: Billing enforcement and customer visibility implemented; payment-provider automation deferred
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

## 2026-07-03 Implementation Slice

This first slice establishes AiFrogi as the billing system of record without adding Razorpay yet.

### Added

- Server-owned plan catalogue for Trial, Starter, Growth, AI Tools, and Custom.
- Persistent subscriptions with trial, billing period, payment provider, status, grace, and cancellation fields.
- Manual invoices with separate fields for:
  - AiFrogi platform fee
  - Meta charges
  - AI overage
  - Services
  - Tax
  - Adjustments
- Usage allowances for contacts, messages, campaigns, AI replies, and team users.
- Customer health score using onboarding, webhook, support, incidents, billing, message failures, automation failures, and usage pressure.
- Customer-scoped and platform-wide incident records.
- Platform audit trail for plan changes, invoices, payments, and incident actions.
- Super Admin billing command center at `/admin/billing`.
- Customer-level audited controls for plan changes, manual invoice issue, payment confirmation, and incident creation.
- Verification script: `npm run verify:billing`.

### Payment Decision

Payment provider remains `MANUAL` in this slice. AiFrogi can issue invoices and record UPI, bank transfer, or manually generated payment-link references. Razorpay should connect later to the same subscription and invoice records through authenticated, idempotent webhooks.

### Guardrails

- Plan and usage limits are server-owned.
- Client and Super Admin dashboards remain separate.
- No payment card data is stored.
- Meta charges remain visibly separate from AiFrogi fees.
- Every billing and incident action creates an audit record.

### Next Slice

1. Add entitlement enforcement and graceful limit warnings.
2. Add client-facing billing and usage view.
3. Add overdue recovery and read-only states without deleting customer data.
4. Stabilize pricing with early customers.
5. Integrate Razorpay checkout and webhook reconciliation after pricing is confirmed.

### 2026-07-05 Increment

- The TRIAL plan is strictly limited to 30 days and automatically changes to `PAUSED` when it expires.
- Paused workspaces retain data and read access while messaging, campaigns, automation, and new team invitations are refused server-side.
- Customer billing now shows plan state, trial days, allowances, usage, invoices, and paid-plan choices.
- Plan allowances are enforced server-side for messages, campaigns, and team users.
- Super Admin now has a dedicated platform audit trail and visible paused-trial count.
- Customers can review and revoke active sessions; local session revocation is checked in both the application and request proxy.
