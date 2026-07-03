# Product Memory: 2026-07-03 Section 06 Billing And Super Admin

## Decision

AiFrogi needs a provider-neutral billing foundation before Razorpay. Pricing, usage limits, invoices, incidents, and operator actions must belong to AiFrogi so a payment gateway remains replaceable.

## Implemented

- Added billing plans, subscriptions, invoices, usage records, platform incidents, and platform audit logs.
- Added Trial, Starter, Growth, AI Tools, and Custom server-side plans.
- Kept payment provider as `MANUAL`.
- Separated invoice amounts for platform fee, Meta charges, AI overage, services, tax, and adjustments.
- Added customer health scoring from operational and billing signals.
- Added `/admin/billing` command center.
- Added audited controls on each customer:
  - change plan
  - issue invoice
  - record manual payment
  - open incident
- Added `npm run verify:billing`.

## Product Principle

Super Admin sees platform complexity and exact intervention queues. Clients should later see only plan, usage, invoice status, and the next required action.

## Razorpay Boundary

Razorpay is postponed until pricing is stable with early customers. Future Razorpay checkout and webhooks must update the existing subscription and invoice records, not create a separate billing truth.

## Next

Add entitlement enforcement, client-facing billing, overdue recovery, usage warnings, and then Razorpay reconciliation.
