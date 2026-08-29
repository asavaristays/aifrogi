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

- Product/category: BusinessGPT, HotelGPT, PingBook, DineGPT, PropertyGPT, FlowCart, or Custom
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
