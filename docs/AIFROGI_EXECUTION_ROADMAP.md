# AiFrogi execution roadmap

Status date: 9 September 2026  
Owner: Founder  
Purpose: one authoritative sequence for product decisions and delivery. If another plan conflicts with this roadmap, stop and resolve the conflict before implementation.

## North-star outcome

AiFrogi must let a normal business create a trustworthy website AI bot that:

- answers its customers naturally from approved business truth;
- understands conversational context and genuine commercial intent;
- captures a lead only when useful and with consent;
- hands the conversation to the client team conclusively;
- gives the client clear operational, billing and performance visibility;
- remains tenant-isolated, measurable, reversible and affordable to operate.

## Non-negotiable boundaries

1. Sovereign/Core Intelligence and Tenant Bot Intelligence are separate workstreams. Never develop, test or deploy them in the same batch.
2. Customer usefulness comes before new features. A technically safe but unhelpful answer is a failed answer.
3. Automated scores are screening evidence, not human acceptance.
4. Ordinary questions are answered first. Qualification and contact capture begin only after genuine commercial or human-contact intent.
5. WhatsApp is outside the current website-bot product and will use a separate subdomain/project when resumed.
6. No unverified price, availability, policy, address, contact detail, promise or completed action may be presented as fact.
7. Work in batches of no more than three related changes, with one build, one reversible VPS deployment and one changed-journey verification.
8. `docs/PENDING_VPS_CHANGES.md` is the only undeployed-change queue. A blank queue means local committed product source and production are aligned for tracked packages.

## Intelligence capability ledgers

- `CORE_INTELLIGENCE_LEDGER.md` is the authoritative register for shared behavior inherited by every bot.
- `TENANT_INTELLIGENCE_LEDGER.md` is the authoritative register for tenant knowledge capabilities and each client's readiness evidence.
- Search and update the appropriate ledger before implementing or deploying intelligence work. An existing capability must be extended under its current ID instead of being rebuilt under a new name.
- A daily log records chronology; these ledgers record current capability ownership and prevent duplication.

## Current proven baseline

- Webtechnosys is the first accepted reference bot.
- Its 25-question production set passed 25/25 after human review and targeted corrections.
- Shared context now retains natural follow-ups and time/place intent.
- Website widget, responsive presentation, close action, light/dark/system themes, main menu and optional welcome/offer card are live.
- Client Today, Team Inbox, Leads, Reports, Setup, Intelligence, Billing and Support are live.
- Lead capture is answer-first, intent-triggered, consented and tenant-visible; Super Admin sees aggregate awareness only.
- Billing credits, free grants, history, Razorpay handling and payment notification paths are implemented.
- Capacity monitoring and storage maintenance are present; production currently targets the first 100 bots and 10,000 replies per day, but real pilot load evidence is still required.

## Phase 1 — second friendly-client pilot

Priority: **NOW**  
Workstream: **Tenant Bot Intelligence only**  
Timebox: onboarding plus 7–14 days of controlled live use.

### Entry requirements

- Cooperative service-business client with one accountable approver.
- Low regulatory risk; avoid healthcare, legal, lending and payment advice for this pilot.
- Client provides website, services, pricing rules, policies, contact details, operating boundaries and escalation contact.

### Delivery sequence

1. Create the client and website bot through the real self-service journey.
2. Import website/PDF/Excel/manual facts as tenant-bound draft knowledge.
3. Resolve contradictions and obtain client approval for commercial and contact facts.
4. Complete the vertical required-question coverage bank.
5. Generate 10 smoke questions; stop and correct if any fundamental answer fails.
6. Generate a 25-question tenant golden set covering facts, context, boundaries, commercial intent and handover.
7. Human-review every answer before installation.
8. Install for limited traffic and review live gaps, negative feedback, leads, latency and credits daily.

### Exit gate

- Zero wrong high-risk facts, privacy violations, internal-language exposure or premature contact capture.
- At least 90% human-rated Good; every Wrong answer corrected and retested.
- Contact, service, price/policy boundary, context follow-up and human handover all pass live.
- Client approver accepts the bot for continued pilot use.

## Phase 2 — Tenant Intelligence Factory

Priority: **after evidence from two real bots**  
Workstream: **Tenant Bot Intelligence only**

Build the repeatable system that prevents manual bot-by-bot repair:

1. **Source compiler:** convert website, PDF, Excel and guided answers into atomic draft claims with source, topic, freshness and confidence metadata.
2. **Approval desk:** show uncertain, conflicting and commercially sensitive facts to the client for approve/edit/reject decisions.
3. **Coverage gate:** map each bot category to required customer questions and prevent go-live while essential truth is missing.
4. **Golden-set generator:** create tenant-specific smoke and 25-question suites from approved facts and vertical risks.
5. **Learning loop:** route poor/flagged answers into tenant review, publish versioned corrections and rerun affected questions before release.

### Exit gate

- A new friendly client can progress from sources to an approved testable bot without engineering editing code or production data.
- Corrections remain tenant-isolated, versioned, reversible and audited.
- Golden tests are generated from the tenant’s actual truth, not a generic question dump.
- A second tenant cannot see, retrieve or affect Webtechnosys knowledge or evidence.

## Phase 3 — Core Intelligence evidence improvements

Priority: **only after pilot evidence identifies a shared failure**  
Workstream: **Sovereign/Core Intelligence only**

Eligible work includes shared context resolution, intent routing, evidence selection, safety, authority, consent, handover and reliability behavior. A tenant knowledge gap is never fixed here.

### Exit gate for each Core change

- Reproduced on at least two bot contexts or proven to be structurally shared.
- Shared fix has focused normal, edge, tenant-isolation and fallback tests.
- No client fact is embedded in Core code.
- The originating live journey and relevant family regression both pass.

## Phase 4 — first-100-bot operating readiness

Priority: **before broad paid onboarding**

1. Measure real replies per minute, p95 latency, model failures, database load, memory, CPU, disk and credit cost.
2. Load-test the website-answer path toward 10,000 replies/day without consuming uncontrolled model credits.
3. Prove rate limits, queue/back-pressure behavior, graceful fallback and recovery.
4. Run database backup restoration and application rollback drills.
5. Make Super Admin capacity recommendations actionable: current load, safe headroom, upgrade trigger and estimated resource increase.
6. Define alert thresholds and an incident owner for availability, payment, email, storage and abnormal credit use.

### Exit gate

- Measured safe capacity supports 100 active bots and 10,000 daily replies with stated headroom.
- Super Admin receives an upgrade warning before a capacity limit becomes a customer incident.
- Restore and rollback evidence is current, not assumed.

## Phase 5 — commercial beta and controlled growth

1. Confirm trial allocation, 15-day expiry, plan purchase, credit-pack purchase and Super Admin free-credit grant with real reconciled transactions.
2. Confirm client and Super Admin billing histories agree and notification email evidence is retained.
3. Publish onboarding/support material based on the two completed pilots.
4. Onboard 5 bots, review outcomes, then 10–15 bots before considering wider release.
5. Review answer quality, conversion, support demand, cost per reply and churn signals weekly.

### Exit gate

- Clients can self-serve from signup to a useful live bot with no hidden engineering step.
- Payment, credits, support and knowledge correction have accountable owners and evidence.
- Expansion is based on pilot measurements, not feature count.

## Parked until evidence justifies them

- Model fine-tuning.
- Cross-session personal memory.
- Autonomous booking, payment or external-system actions beyond governed connectors.
- WhatsApp implementation in this website-bot project.
- Large new persona families or decorative dashboard features.
- Infrastructure expansion before capacity telemetry recommends it.

## Daily operating rule

At the start of each work session:

1. Read this roadmap, the intelligence boundary, both intelligence ledgers, today’s daily log and the pending VPS ledger.
2. State the active phase, product area and intelligence layer.
3. Choose one measurable outcome and no more than three related changes.
4. Put unrelated requests into the roadmap backlog; do not silently change direction.
5. Finish implementation, focused tests, human journey review, deployment evidence and documentation before starting another layer.

## Immediate next action

Select and onboard one friendly low-risk service-business client under Phase 1. Do not begin the Tenant Intelligence Factory or another Core feature until the client’s initial facts and 10-question smoke set reveal what must be automated.
