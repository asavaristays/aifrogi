# 2026-07-03 Operating Flow Memory

AiFrogi now tracks one shared operating flow for customers and Super Admin. The customer view hides Meta and credential complexity behind clear stages; Super Admin gets explicit proof controls for the steps that still happen outside the product.

## Flow Stages

1. Account and organization
2. Business verification
3. WhatsApp connection
4. Template and first message
5. Knowledge and handoff
6. First compliant campaign
7. Automation proof
8. Billing readiness

## In-System Evidence

- Organization profile, status, website, owner mobile, and business address
- KYC status
- WhatsApp integration, webhook, token, and Meta status
- Approved knowledge entries
- Live non-test campaigns
- Completed and dead automation jobs
- Active or trialing subscription and overdue invoice count

## Out-of-System Proof Controlled By Super Admin

- Meta billing eligibility: `NOT_CONFIRMED`, `CONFIRMED`, `BLOCKED`
- Template status: `NOT_STARTED`, `PENDING`, `APPROVED`, `REJECTED`
- First message status: `NOT_STARTED`, `READY`, `PASSED`, `FAILED`

Every Super Admin proof update writes both customer activity and platform audit logs.

## Design Intent

The customer should always know the next action, who owns it, and why progress is blocked. The Super Admin should see the same flow and be able to update external proof without exposing credentials or Meta implementation detail to the customer.
