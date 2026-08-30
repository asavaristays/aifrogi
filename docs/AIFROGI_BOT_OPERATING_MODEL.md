# AiFrogi Business Bot Operating Model

**Decision recorded:** 29 August 2026  
**Status:** Canonical product and role model

## Operating flow

1. AiFrogi SuperAdmin creates the first business workspace and Business Bot.
2. SuperAdmin selects the bot category/persona, operating mode, channels, permitted capabilities, human-handoff policy, and approval boundary.
3. SuperAdmin and the customer add proposed intelligence from trusted sources: the official website, CSV or other supported documents, manually entered business answers, approved external sources, and connected systems of record.
4. A Client Admin reviews conflicts and explicitly approves knowledge before the AI may use it.
5. Go-live evaluation confirms grounded answers, safe fallback, human handoff, tenant isolation, channel delivery, and any approved business action.
6. SuperAdmin completes onboarding and invites or activates the customer’s Client Admin.
7. The Client Admin signs in to its own workspace, completes or corrects permitted business information, and operates the bot day to day.

## Authority model

### AiFrogi SuperAdmin

- Create, activate, suspend, and support customer workspaces
- Select or change the bot product/category and core capability blueprint
- Configure infrastructure, OpenAI, Meta, and approved connector boundaries
- Review onboarding and platform health
- Access private customer content only through a scoped, time-bound, audited support grant

### Client Admin / Bot Admin

- Own and maintain business information
- Add, review, approve, reject, and retire trusted knowledge
- Manage team access within the workspace
- Review conversations, leads, handoffs, knowledge gaps, and outcomes
- Correct bot instructions and escalation topics within the approved blueprint
- Manage customer-owned connector authorisation and request support
- Never gain access to another customer workspace or platform secrets

### Operator / Agent

- Work assigned conversations and human handoffs
- Update permitted contact and operational records
- Cannot change core bot authority, credentials, billing, or approved intelligence unless explicitly authorised

### Viewer

- Read permitted dashboards and reports
- Cannot send, approve, configure, or mutate protected operations

## Governed intelligence lifecycle

Every source follows this lifecycle:

`Proposed source → extracted/crawled → conflict review → Client Admin approval → available to AI → monitored → corrected or retired`

An imported file or website is a **trust-source candidate**, not automatically trusted intelligence. Approval, provenance, review status, workspace ownership, and update time must remain visible.

Supported now: official website pages, PDF, DOCX, TXT, Markdown, CSV, JSON, and manual approved answers. Native XLS/XLSX extraction must not be advertised until a maintained parser is security-reviewed and implemented; customers can export Excel workbooks to CSV in the interim.

## Bot persona

Persona is not cosmetic. It is a governed combination of:

- Product/category: BusinessGPT, HotelGPT, ClinicGPT, DineGPT, PropertyGPT, FlowCart, or Custom
- Business purpose and measurable outcome
- Tone, language, and response style
- Approved knowledge domains
- Allowed questions and actions
- Prohibited claims and sensitive topics
- Negotiation authority and limits
- Human escalation triggers
- Channel-specific presentation

The persona cannot override global safety rules, customer consent, connector permissions, or the workspace boundary.

## Secure runtime

OpenAI is a processing engine, not the owner or system of record for the business intelligence. AiFrogi selects the minimum approved context required for a response. Credentials remain server-side. Website, WhatsApp, and future channels use adapters. PMS, channel manager, calendar, payments, CRM, maps, and other services remain governed connectors with scoped credentials and verified outcomes.

## Daily AI operations

The Client Admin workspace must bring together:

- Unified website and WhatsApp inbox
- AI responding, human requested, human joined, resolved, and closed states
- Human action queue and service-level indicators
- Lead/contact records and consent
- Knowledge coverage, source freshness, conflicts, and unanswered questions
- Answer testing and approval
- Connector health and failed actions
- Outcome and conversion reporting
- Audit trail and support-access status

## Product completion rule

A bot is onboarded only when its business identity, category/persona, approved intelligence, channel connection, safety and authority rules, human handoff, test conversations, and owner access are verified. A connected API key alone does not constitute a completed AI Business Bot.

## Multi-category platform decision

AiFrogi will implement multiple categories of AI Business Bot on one secure sovereign platform. Categories are configuration and intelligence blueprints on the common runtime, not separate applications or duplicated client-specific codebases.

The intended product family is:

- **BusinessGPT:** general services, business questions, lead capture, qualification, and human follow-up
- **HotelGPT:** hospitality knowledge, stay enquiries, availability, negotiation boundaries, and booking handoff
- **ClinicGPT:** services, staff, calendars, appointment booking, and verified `AppointmentConfirmed` outcomes
- **DineGPT:** menus, dietary information, restaurant reservations, offers, and order or human handoff
- **PropertyGPT:** property inventory, buyer qualification, regulatory information, site visits, and sales routing
- **FlowCart:** catalog, inventory, orders, delivery, returns, and commerce workflows
- **Custom Business Bot:** a controlled blueprint for requirements that do not fit an approved standard category

Every category shares:

- Tenant-isolated organizations and workspaces
- Users, roles, sessions, and permissions
- Governed intelligence and trusted-source approval
- Common channel contracts and adapters
- Website and WhatsApp conversations
- Unified inbox and human takeover
- OpenAI processing boundaries
- Audit records and support-access controls
- Consent, privacy, retention, and deletion controls
- Connector health, analytics, and verified outcomes

Each category defines its own:

- Onboarding inputs and business terminology
- Persona, response style, and supported languages
- Required internal and external knowledge
- Permitted capabilities and business actions
- Negotiation authority and commercial limits
- Safety rules and escalation triggers
- Required connectors and systems of record
- Go-live evaluations and measurable outcomes

## Category delivery sequence

AiFrogi must not attempt to complete every category simultaneously. The platform should first prove two reusable operating patterns:

1. **Webtechnosys BusinessGPT** proves grounded business answers, qualification, consented lead capture, knowledge improvement, and human follow-up.
2. **ClinicGPT** proves a transactional bot that uses authority-controlled tools and read-back verification to record `AppointmentConfirmed`.

After these knowledge-based and action-based patterns are stable, HotelGPT becomes the principal commercial vertical. HotelGPT begins with governed knowledge and enquiry capture. It may claim live room availability only after a verified PMS, channel-manager, or booking-engine connector reads the current system of record. DineGPT, PropertyGPT, FlowCart, and Custom blueprints follow through the same shared runtime.

## Multi-category engineering guardrail

Before adding category-specific code, engineering must determine whether the requirement belongs in:

1. The shared sovereign runtime
2. A reusable capability or connector
3. A category blueprint
4. Customer-owned governed knowledge or configuration

Only the fourth layer should normally vary per customer. A new customer must not require a fork of AiFrogi. A new category must not bypass the common security, knowledge, conversation, tool-authority, audit, or outcome contracts.

## Execution baseline implemented

The following operating-model controls are implemented in the application baseline:

- Bot persona, business objective, tone, languages, prohibited claims, and escalation triggers persist per organization.
- SuperAdmin controls category, channels, capabilities, operating mode, human handoff, and business-action approval.
- Client Admin can maintain the governed persona but cannot expand the bot's category or authority.
- The response runtime loads the workspace persona server-side and binds it into OpenAI instructions together with global safety rules and approved knowledge.
- Bot readiness is computed from real blueprint, persona, business review, approved intelligence, safety, channel, and authority evidence.
- Client Admin sees the readiness score, incomplete gates, and corrective links in the daily operations dashboard.
- Existing bots receive conservative persona defaults during migration; Webtechnosys retains the approved “Webtechnosys team” customer-facing identity.
- New bot profiles cannot be saved without a persona name, business objective, and enabled language.

Readiness does not itself activate an external business action. Appointment, availability, order, payment, CRM, PMS, channel-manager, and similar actions still require their own connector, permission, idempotency, read-back verification, outcome evidence, and rollback controls.

## Version-one human response SLA

The initial commercial release uses only SuperAdmin and AI Bot Admin for human-response ownership. A generic AI Bot User or Operator role is deferred until design-partner evidence proves that assignment delegation is needed.

AI Bot Admin can configure:

- Human response SLA from 5 minutes to 24 hours
- Reminder threshold from 10% to 90% of the SLA
- Whether an approved safe holding-message fallback is eligible after expiry
- The customer-facing fallback wording

The Bot Operations dashboard calculates the live response report from the latest customer message across workspace conversations. It shows waiting, reminder, overdue, oldest-waiting, and fallback-eligible conversations. Resolved conversations disappear when the team replies.

Version-one fallback is intentionally **reporting-only**. Enabling the policy marks overdue conversations as approved fallback candidates; it does not send a customer message automatically. Automated delivery requires a later channel-specific implementation with one-send idempotency, active-window/template rules, delivery evidence, cancellation when a human replies, and a permanent escalation audit record.
