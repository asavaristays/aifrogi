# LeadOS Product Memory: Post-Update Snapshot

Snapshot date: 2 July 2026 (Asia/Kolkata)

This document records the deployed state after the second-stage LeadOS foundation update. Read it together with `2026-07-02-pre-update.md` to understand what changed.

## Product Vision Now Encoded

LeadOS is a calm control plane for business messaging. The client experience answers:

1. What is happening?
2. What needs my attention?
3. What will LeadOS do next?

Technical complexity is progressively disclosed. Clients see readiness, outcomes, ownership, and one safe action. Super Admin sees operational detail and recovery context.

## Deployed Product Changes

### Public Product And Commercial Layer

- `https://lead.hotelradar.in/` is now a public LeadOS product experience instead of an automatic dashboard redirect.
- The first viewport presents the actual product promise and a working-product visual, not a generic marketing hero.
- Public sections explain the operating loop, guided dashboard, automation boundaries, trust model, and trial (subsequently standardized to 15 days).
- Pricing is shown as:
  - Starter: ₹1,650/month, ₹4,950 billed quarterly.
  - Growth: ₹3,550/month, ₹10,650 billed quarterly.
  - AI Operations: ₹5,500/month, ₹16,500 billed quarterly.
- The UI explicitly separates the LeadOS subscription from Meta message charges, taxes, custom integrations, and additional AI usage.
- Public Security and Disclaimer pages are live.
- Legal navigation now connects Privacy, Terms, Disclaimer, Data Deletion, and Security information.

### Product Design System

- The interface now uses a restrained neutral palette, system-native typography, compact controls, consistent 8px-or-less card radii, and accessible focus treatment.
- Dark blue and mixed legacy palettes were replaced in the core shell with a quieter charcoal/green system.
- Sidebar width and navigation density were reduced.
- Non-functional global search was removed.
- The top-bar attention control now opens the real inbox.
- Shared status language is available through success, waiting, error, and information states.
- Desktop and mobile public layouts were visually verified with no horizontal overflow.

### Client Dashboard

- `/dashboard` is now predictive rather than report-first.
- It prioritizes unanswered conversations, billing failures, template-window failures, Meta engagement limits, unavailable recipients, and connection blockers.
- Each attention item includes cause, impact, and a direct recovery action.
- Readiness combines business verification, Meta status, WhatsApp connection, webhook, and billing evidence.
- The dashboard shows recent conversations, response performance, automation boundaries, and support state without an oversized hero.
- Delivery failure metrics now include specific `failed_*` states instead of only generic failure.

### Super Admin

- `/admin` is now a command center rather than a redirect.
- It displays customer readiness, open/high-priority support, message failures, campaign-run count, and Tech Provider status.
- The operator queue prioritizes KYC review, support impact, and delivery health.
- Customer readiness separates KYC, Meta, webhook, plan, and next operator action.
- The admin navigation now includes Overview, Customers, Support, and Operations.

### Predictive Onboarding

- Onboarding now begins with a prerequisite checklist.
- Required items include owner details, business proof, WhatsApp SIM access, secure Meta connection, platform review, and first messaging test.
- Every prerequisite identifies its owner: `You`, `LeadOS`, or `Meta`.
- Status review explains responsibilities and preserves the no-password/no-token-sharing model.
- Existing six-step onboarding data and business-document workflow remain intact.

### Support Operations

- Durable `SupportTicket` and `SupportTicketMessage` records were added.
- `/support` provides resource-first help for onboarding, delivery, campaigns, and automation.
- Customers can create categorized and prioritized requests without sharing credentials.
- Tickets automatically include organization context.
- Customers can review their support history and responses.
- `/admin/support` provides the operator queue.
- `/admin/support/[id]` supports replies, assignment/status control, resolution notes, and a complete conversation.

### Campaign Reliability

- Broadcast sends now create a durable `Campaign` run.
- Every recipient is stored as a `CampaignRecipient` with acceptance, external message ID, error, delivery, and read state.
- Meta webhooks update campaign recipient status as well as inbox message status.
- Campaigns record requested, sent, delivered, read, and failed counts plus a concise error summary.
- Image-header templates are supported through a public image link or Meta media ID.
- The campaign builder includes a preset for the correct approved creative:
  - Template: `goa_ai_audit_image_v2`
  - Public image: `https://lead.hotelradar.in/media/campaigns/goa-ai-audit-v2.jpg`
- The image URL is publicly reachable by Meta and does not redirect to authentication.
- Campaign creation includes consent confirmation, category selection, audience count, and estimated Meta charge.
- The current batch guardrail remains 20 recipients.

### Realtime Bot And Knowledge

- The real inbound decision path is now visible on `/workflows`.
- First inbound message: structured welcome/menu.
- Later question: intent classification, relevant website knowledge retrieval, OpenAI answer, deterministic fallback, or human handoff.
- The website knowledge crawler remains scoped to `https://website.hotelradar.in` and groups content into business buckets.
- Irrelevant zero-score pages are no longer sent to OpenAI as context.
- The bot constitution now explicitly covers prompt boundaries, no invention, short answers, one follow-up question, jargon avoidance, secure-data restrictions, STOP handling, sensitive-topic handoff, tenant privacy, and English-only operation.
- The outdated callback number in the trial reply was corrected to `+91 70589 63898`.

### Delivery Error Clarity

Future Meta webhook failures are classified as:

- `failed_payment_required`
- `failed_template_required`
- `failed_engagement_limit`
- `failed_recipient_unavailable`
- generic `failed` only when no known cause mapping exists

The dashboard converts these into cause, impact, and next-action guidance.

### Database And Deployment

- New additive tables are live: `SupportTicket`, `SupportTicketMessage`, and `CampaignRecipient`.
- The existing `Campaign` table was extended without deleting rows.
- A pre-migration schema backup was created on the production server.
- Existing public-table ownership was normalized to the application database role so future additive migrations are controlled consistently.
- Production build passes and PM2 reports `lead-os-ai` online with zero unstable restarts.
- Existing production data remained unchanged after migration: 1 organization, 25 leads, and 87 messages at verification time.

## Verification Completed

- `npm run typecheck`: passed.
- `npm run lint`: passed with pre-existing non-blocking warnings only.
- `npm run build`: passed locally and in production.
- Public homepage, Security, and Disclaimer: HTTP 200.
- Correct public campaign image: HTTP 200 `image/jpeg`.
- Protected dashboard, support, and admin routes: correctly redirect unauthenticated users.
- New database tables: present.
- PM2 process: online.
- Production error log after final restart: clean.

## Important Product Truths

- Realtime inbound knowledge automation is active.
- Defined timed workflows are not yet a durable background job system. Template readiness is not the same as scheduled execution.
- Meta wallet balance is not currently read through an API. LeadOS infers billing blockers from delivery webhooks and directs the client to Meta billing.
- The public product walkthrough is an interactive visual explanation, not yet a recorded video asset.
- The displayed pricing is now implemented but remains a commercial decision that HotelRADAR should formally approve before paid launch.
- The first post-update campaign will create the first persisted campaign record; historical broadcasts sent before this update cannot be reconstructed fully from current data.

## Next Production Gates

These are the recommended gates from the current 7/10 beta foundation toward a stable commercial product.

### P0: Reliability And Compliance

- Durable automation job queue with retries, idempotency keys, locks, quiet hours, pause/resume, and dead-letter handling.
- Explicit WhatsApp consent ledger with source, scope, timestamp, proof, and opt-out history.
- Webhook event ledger and replay controls.
- Campaign send confirmation with final audience diff and charge ceiling.
- Rate limiting and abuse protection for public and authenticated APIs.
- Automated tenant-isolation and role-authorization tests.
- Subscription enforcement, invoices, payment reconciliation, and low-balance policy.
- Data retention controls, export, organization deletion, and backup-restore testing.
- Central error monitoring, uptime checks, alerting, and an incident runbook.

### P1: Product Completeness

- Template catalogue synchronized from Meta with category, status, language, header type, and preview.
- Visual workflow builder backed by the durable executor.
- Knowledge source management, freshness alerts, per-source enable/disable, answer trace, and operator feedback.
- Unified notification center with actionable events.
- Working cross-product search.
- Client team roles, invitations, assignment, SLAs, and audit history.
- Campaign analytics by delivered, read, reply, opt-out, conversion, and estimated spend.
- Support SLA, attachments, internal notes, and reusable resolution articles.

### P2: Growth And Polish

- Recorded 60-90 second homepage product video with captions and a static fallback.
- Final pricing approval, annual billing, add-ons, usage allowance, and enterprise terms.
- Public documentation and onboarding resource center.
- Accessibility audit, keyboard QA, screen-reader QA, and target-browser matrix.
- Mobile inbox and campaign workflow optimization.
- Customer health score and proactive Super Admin alerts.
- Product analytics for activation, onboarding drop-off, time-to-live, campaign success, and support burden.

## Security Reminder

Do not store or repeat credentials in product memory. Any email password, access token, OTP, or permanent token previously shared through chat must be rotated and managed through the proper provider settings.
