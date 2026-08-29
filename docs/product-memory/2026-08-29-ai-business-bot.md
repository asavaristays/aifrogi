# AiFrogi AI Business Bot — Product Memory

Last verified: 29 August 2026  
Public product: **AiFrogi**  
Reference implementation: **Webtechnosys AI Business Bot**  
Production application: `https://app.aifrogi.com`  
Reference website: `https://webtechnosys.com`

## Why this document exists

This is the durable product and engineering memory for the AiFrogi AI Business Bot. Read it before changing the bot, onboarding, intelligence, inbox, actions, outcomes, reports, website widget, or channel integrations.

Never add passwords, API keys, access tokens, OTPs, database URLs, private session values, or customer secrets to this document or the repository.

## Locked product vision

AiFrogi builds **Sovereign Business Bots**.

A Sovereign Business Bot:

- Represents one identified business and its approved operating context.
- Uses intelligence owned, reviewed, and preserved by that business.
- Does not present general model knowledge as verified business truth.
- Keeps customer conversations, consented contact details, actions, and outcomes inside the business workspace.
- Uses external language models as processors, not as the owner or permanent source of the business intelligence.
- Makes business actions observable, permission-controlled, auditable, and reversible where possible.
- Escalates to a human when knowledge, authority, confidence, or verification is insufficient.
- Measures verified business outcomes instead of reporting only message volume.

Core market position:

> AiFrogi gives every business a sovereign AI bot that owns its intelligence, preserves its data, assists customers across approved channels, and turns conversations into verified business outcomes under human control.

## Product model

The bot category describes its business job. Website and WhatsApp are channels used by the same business bot; they are not separate product identities.

Supported bot categories:

- Regular AI Business Bot
- PingBook appointment bot
- FlowCart commerce bot
- Stay/hospitality bot
- Custom business bot

Supported operating modes:

- Answer only
- Capture and qualify leads
- Perform approved actions
- Require human approval

Channels are implemented through a neutral channel foundation. WhatsApp is the first operational adapter and must remain a connector rather than the core architecture.

## Current production scope

Only these production businesses should remain unless a new client is deliberately approved and onboarded:

### Webtechnosys

- Purpose: reference AI Business Bot and public demonstration of first-party business intelligence.
- Channel: Website Bot.
- Public location: `https://webtechnosys.com`.
- Workspace login identity: `admin@webtechnosys.com`.
- Intelligence: approved Webtechnosys website sources, uploaded documents, manual business truths, and resolved knowledge gaps.
- Customer data: consented conversations and contact requests are stored in AiFrogi.
- Human identity in the widget: **Webtechnosys team**.
- Product attribution: subtle **Powered by AiFrogi**.

### HotelRadar

- Purpose: retained WhatsApp Bot reference implementation.
- Channel: WhatsApp.
- Connected production number: `+91 70589 63898`.
- Test chat data was cleared on 29 August 2026.
- Preserve the connected WhatsApp configuration unless an authorized migration is planned.

The obsolete PingBook demo clinic tenant and unused HotelRadar website property were removed on 29 August 2026.

## Live platform capabilities

### Client and admin access

- Client and admin login selection.
- Forgot-password flow.
- Logout and session management.
- Workspace selection and tenant-safe routing.
- Webtechnosys administrators must enter the Webtechnosys workspace, not HotelRadar.

### AI Operations Inbox

- Website and WhatsApp conversations appear in one channel-neutral operations workspace.
- Operators can search and filter conversations.
- Website replies are prevented from accidentally using the WhatsApp delivery endpoint.
- Operators can create follow-ups, human reviews, appointments, quotes, orders, escalations, and notes.
- Actions are scoped by both property and lead.

### Verified outcomes

Supported outcome types include:

- Qualified
- Appointment confirmed
- Quote sent
- Order created
- Won
- Lost
- Escalated
- Resolved

An action cannot be completed as a verified outcome without both an outcome type and evidence. Reports aggregate open, overdue, completed, and verified actions and recorded business value.

### Sovereign Business Intelligence

- Approved website sources.
- Uploaded business documents.
- Manual business truths.
- Draft, conflict, approval, rejection, and knowledge-gap workflows.
- Safe-answer preview.
- Human-handoff topics and operating instructions.
- Business-owned context is distinguished from language-model processing.

### Channel foundation

The neutral foundation includes:

- `ChannelConnection`
- `Conversation`
- `Participant`
- Neutral `Message`
- Common inbound and outbound contracts
- `ChannelAdapter` interface
- WhatsApp adapter wrapper
- Tenant-safe routing
- Idempotency requirements
- Legacy compatibility and feature-flag fallback

## Webtechnosys widget specification

The current widget height is approved and should not be reduced without a new design decision.

Current interaction requirements:

- Three animated dots keep the visitor informed while an answer is prepared.
- Header modes: `AI ready`, `AI responding`, `Human requested`, `Human joined`, and `Conversation closed`.
- AI messages are identified as **Webtechnosys AI**.
- Human messages are identified as **Webtechnosys team**.
- The contact form appears only for human follow-up.
- After the server confirms a successful contact request, the form disappears immediately and resets.
- The footer keeps `Do not share passwords, OTPs or payment details. Human contact` on one line.
- `Powered by AiFrogi` is centered on the line below.
- WhatsApp is an optional human-contact route, not a competing floating widget.
- Webtechnosys colours and visual language remain primary.
- Reduced-motion browser preferences must be respected.

Active website release at the time of this record:

`/var/www/webtechnosys.com/releases/20260829-aifrogi-widget-states`

## Privacy and consent

Approved policy for the Webtechnosys bot:

> Webtechnosys website visitor questions and relevant approved Webtechnosys knowledge excerpts may be processed by OpenAI, with consented conversations and contact details stored in AiFrogi.

Rules:

- Do not collect or request passwords, OTPs, payment credentials, or unnecessary sensitive data.
- Store contact details only after explicit consent.
- Preserve the evidence of consent with the associated enquiry.
- Do not expose one tenant's conversations, actions, intelligence, or reports to another tenant.
- Do not create a public conversation-read endpoint based only on a guessable session identifier.

## Current limitations

The website widget does not yet receive human replies from the AiFrogi inbox in real time.

The next implementation must use a server-issued random visitor capability stored only as a secure hash. A session ID alone, or a deterministic signature automatically issued for any caller-provided session ID, is not sufficient authorization to retrieve private conversation content.

The secure website handoff must include:

- Server-created high-entropy visitor capability.
- Hashed capability storage.
- Capability rotation and expiry.
- Authenticated operator-to-widget reply retrieval.
- Delivery and read state.
- Unread notification when the widget is minimized.
- `Human joined` and `Conversation closed` transitions.
- Rate limiting and tenant binding.
- Automated privacy and cross-tenant tests.

## Next engineering sequence

1. Add the secure website visitor-session data model and migration.
2. Bind new website conversations to server-issued visitor capabilities.
3. Connect operator replies from AI Operations to the correct active widget.
4. Activate human joined, delivery/read, unread, expiry, and closed states.
5. Run realistic Webtechnosys end-to-end testing.
6. Improve intelligence citations, source refresh, version history, conflict handling, and answer evaluation.
7. Implement PingBook as the first verified tool-using vertical.
8. Roll out to three design partners representing different operating conditions.

## PingBook milestone after website handoff

The first verified agentic outcome remains `AppointmentConfirmed`:

1. Understand requested service and date.
2. Read actual calendar availability.
3. Present valid slots.
4. Receive explicit customer confirmation.
5. Create the appointment idempotently.
6. Read it back from the system of record.
7. Record `AppointmentConfirmed` with evidence.
8. Escalate to a human if creation or verification fails.

Do not introduce unverified tool actions or claim appointment success before read-back verification.

## Engineering safeguards

- GitHub is the recoverable code source of truth.
- Production changes require a committed version or documented website release.
- Use additive database migrations.
- Back up production before destructive tenant or conversation changes.
- Preserve rollback paths.
- Never overwrite server secrets during deployment.
- Run type checking, production build, channel/security tests, migration validation, and secret-bundle checks in proportion to the change.
- Existing WhatsApp behavior must remain unchanged when the neutral-channel feature flag is disabled.
- Do not invent test actions or outcomes in a real client workspace.

## Verified production baseline

AiFrogi application release recorded with this memory: `59782a1`.

The corresponding implementation established:

- AI Operations data model and API.
- Unified Website and WhatsApp inbox.
- Evidence-required verified outcomes.
- Cross-channel reports.
- Sovereign Business Intelligence language and controls.
- Channel-safe website reply recording.
- Sixteen passing channel, website security, and AI Operations tests.

Production cleanup backup:

`/var/backups/aifrogi/pre-tenant-cleanup-59782a1.dump`

This backup contains the state immediately before the 29 August 2026 tenant and HotelRadar test-chat cleanup and must be protected according to the production backup retention policy.

## Decision test for future upgrades

Before approving a feature, ask:

1. Does it strengthen business-owned intelligence?
2. Does it preserve tenant ownership and privacy?
3. Is every business action permission-controlled and auditable?
4. Can the claimed outcome be verified from a system of record?
5. Is human intervention available when confidence or authority is insufficient?
6. Can the feature be rolled back without damaging the running business bot?

If the answer to any relevant question is no, the feature is not yet production-ready.
