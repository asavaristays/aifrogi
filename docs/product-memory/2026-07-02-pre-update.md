# LeadOS Product Memory: Pre-Update Snapshot

Snapshot date: 2 July 2026 (Asia/Kolkata)

This document records LeadOS immediately after first-level beta testing and before the second-stage product redesign. It is a factual baseline, not a future-state specification.

## Product Position

LeadOS is HotelRADAR's multi-tenant operations layer for WhatsApp Business messaging, contact management, campaigns, onboarding, automation, knowledge-assisted replies, and human support. HotelRADAR AI Agency is verified by Meta as a Tech Provider through the webtechnosys business portfolio.

The intended product promise is simple: a client can connect and operate WhatsApp without learning Meta's technical setup or sharing Facebook, email, or token credentials with HotelRADAR staff.

## Verified Beta State

- First-level beta testing is complete.
- The production service at `https://lead.hotelradar.in` is online under PM2.
- One organization is configured and its Meta onboarding status is `LIVE`.
- Production contains 2 workspaces/properties, 25 leads, and 87 stored messages.
- Message status webhooks have recorded delivered, read, and failed outcomes.
- A controlled first broadcast batch was sent to 20 test contacts, followed by one additional internal test recipient.
- At least one genuine prospect selected the `TRIAL` response and received the trial intake flow.
- Inbound and outbound messaging have both been demonstrated.
- Production currently contains no persisted `Campaign` records even though broadcast sends have occurred.
- Recorded delivery failures include payment-required and template-required cases; these are not yet explained clearly enough in the UI.

## Meta And WhatsApp Configuration

- Product sender: HotelRadar AI Agency, `+91 70589 63898`.
- Tech Provider verification is complete.
- Embedded onboarding and client-safe connection foundations exist.
- The WhatsApp business profile has a HotelRADAR profile image and business details.
- The correct approved image campaign template is `goa_ai_audit_image_v2`.
- Never use `goa_ai_audit_image_v1`; it contains the wrong creative.
- Correct source creative: `/Users/manishpurohit/Documents/jodhpur-yatra/hotel-radar-campaign/image-1.jpg`.
- The audit destination is `https://website.hotelradar.in/hotel-website-audit-goa/`.

Approved templates known at this snapshot:

- `goa_ai_audit_trial_v1`
- `goa_ai_audit_image_v2`
- `trial_intake_followup_v1`
- `audit_request_followup_v1`
- `audit_ready_v1`
- `specialist_callback_v1`
- `booking_enquiry_flow_v1`
- `quote_followup_24hr_v1`
- `review_request_v1`
- `manager_daily_digest_v1`

Templates still pending at this snapshot:

- `quote_followup_6hr_v1`
- `missed_enquiry_rescue_v1`
- `website_intent_capture_v1`

## Existing Product Foundations

- Role-aware authentication with admin and client roles.
- Multi-workspace data model.
- WhatsApp inbox, contacts, broadcast builder, analytics, setup, settings, and bot configuration.
- Customer onboarding data model with organization, KYC, documents, phone, Meta connection, token, webhook, and quality statuses.
- Super Admin customer list and customer detail diagnostics.
- Website knowledge crawler and OpenAI-assisted answer service with a bounded answer constitution.
- Public website assistant with service buckets, AI audit, trial, and human handoff choices.
- Workflow catalogue with six defined journeys and live lead counts.
- Privacy Policy, Terms of Service, and Data Deletion pages.
- Encrypted integration credential storage.

## Known Product Gaps

### Automation

- Workflow definitions and readiness exist, but timed workflows do not yet have a durable background scheduler/executor.
- Retry, idempotency, quiet hours, consent gates, failure queues, and operator intervention are not yet represented as one coherent automation runtime.
- Campaign sends are not persisted as complete campaign/audience/run records.

### Chatbot And Knowledge

- Website crawling and knowledge-assisted answers exist, but content freshness, source visibility, confidence, fallback, and human escalation need a complete operating model.
- Random user questions need deterministic routing: answer from approved knowledge, run an approved automation/tool, collect missing information, or hand off.
- The bot constitution needs to be visible and configurable per client while preserving platform-level safety rules.

### User Experience

- UI typography, color, density, button sizing, and hierarchy are inconsistent across modules.
- The interface exposes features but does not consistently predict the next action.
- Errors describe failure more often than cause, impact, and recovery.
- Status language is inconsistent between onboarding, setup, messaging, and administration.
- Search and notification controls are visually present but not yet complete product workflows.

### Onboarding

- A six-step onboarding flow exists, including KYC and Meta connection.
- The product still needs a predictive prerequisite checklist before onboarding starts.
- Users need clear ownership labels: `You do this`, `LeadOS does this`, and `Waiting for Meta`.
- Expected duration, blocked-state recovery, billing eligibility, and go-live checks need to be surfaced.

### Administration And Support

- Super Admin can inspect customers but does not yet have a full operational command center.
- Client Admin lacks a focused account/readiness dashboard separate from conversation analytics.
- A resource-led support ticket system does not yet exist.
- Support should prioritize onboarding blockers, integration health, billing, and policy/template issues.

### Commercial And Trust

- LeadOS does not yet have a complete public marketing site comparable in clarity to mature WhatsApp SaaS products.
- Pricing needs explicit separation between LeadOS subscription, Meta message charges, optional AI usage, onboarding/services, taxes, and wallet funding.
- Meta wallet/payment responsibility and low-balance behavior are not yet represented in-product.
- Terms, disclaimers, security information, retention, subprocessors, consent responsibility, and Meta dependencies need a consistent trust center.
- Homepage needs a concise self-explanatory product video or interactive walkthrough.

## Second-Stage Product Direction

LeadOS should behave like a calm control plane. Every important screen must answer:

1. What is happening now?
2. What needs attention?
3. What will LeadOS do next?

The product must progressively disclose complexity. Clients see readiness, outcomes, and clear actions. Super Admin sees identifiers, credentials health, webhook events, payment eligibility, policy states, and recovery controls.

The immediate quality target is a coherent 7/10 beta: dependable core journeys, predictive guidance, consistent visual language, transparent pricing and billing, trustworthy onboarding, and operator-visible failures. Advanced autonomous AI should not outrun these foundations.

## Non-Negotiable Design Principles

- One primary action per decision area.
- No oversized controls or decorative dashboard sections.
- Neutral surfaces; green signals action/success, amber signals waiting, and red signals a recoverable problem.
- Status includes cause, impact, owner, and next action.
- Never ask clients to share Facebook, email, or permanent-token credentials.
- Never send a broadcast without consent state, audience preview, estimated Meta cost, and final confirmation.
- AI answers only from approved knowledge or approved tools; uncertainty triggers a transparent fallback or human handoff.
- All automation must be observable, pausable, retryable, and auditable.

## Security Note

No passwords, access tokens, or private credentials are stored in this memory. Any credential previously shared in conversation must be treated as compromised and rotated outside LeadOS.
