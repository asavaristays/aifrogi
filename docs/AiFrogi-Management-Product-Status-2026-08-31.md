# AiFrogi Management Product Status

Reporting date: 31 August 2026  
Revision: 1.1 — management review corrections applied
Product stage: Controlled pilot-grade SaaS  
Management decision: Complete and activate Webtechnosys as the reference bot, then onboard 3–5 controlled clients before evidence-driven optimisation.

## 1. Executive summary

AiFrogi is no longer a website concept or isolated chatbot prototype. It has a functioning multi-tenant application, public marketing site, client and Super Admin operations, governed AI runtime, category personas, knowledge approval, evidence capture, feedback, human handover and connector authority controls.

The technical foundation is suitable for a controlled first-client launch. It is not yet supported by enough real-client production evidence for unrestricted self-service scale or enterprise-readiness claims.

The immediate bottleneck is not another broad development cycle. The Webtechnosys reference bot must finish its approved knowledge coverage and be activated under monitoring.

## 2. Current maturity assessment

Decimal ratings used in earlier working discussions were directional engineering judgments, not audited scores. Management reporting now uses evidence bands until real-client volume supports a reproducible numerical model.

| Area | Maturity band | Evidence basis | Evidence gap |
| --- | --- | --- | --- |
| Frontend and product experience | Strong pilot | Production marketing site and console, responsive layouts, 94-route build, onboarding, inbox, knowledge, pricing, help and admin surfaces | Broader external usability evidence |
| Backend and governance | Strong pilot | Tenant-scoped data, role controls, evidence records, approval lifecycle, safety fallbacks and publication gates | Multi-client operating history |
| Sovereign Intelligence | Strong pilot | 48/48 current tests, Common Suite completeness, Rule 11, persona controls, action verification and evidence consistency | Real-language Safe Resolution Rate |
| Security controls | Pilot-ready | Application controls and zero-tolerance tests | Independent audit and formal certification |
| Reliability and operations | Pilot-ready with monitoring | Health controls, failure attribution and safe connector policy | Sustained workload, recovery and live-connector evidence |
| Controlled reference activation | Ready after KB gate | Platform can operate the Webtechnosys reference bot | Webtechnosys coverage is currently 30% |
| Enterprise scale | Evidence incomplete | Architecture and controls exist | 3–5 client datasets, measured accuracy, support load and connector history |

These bands consider implementation completeness, automated evidence, production evidence, operational repeatability and external assurance. A band increases only when its missing evidence is produced. Registering a client alone does not increase maturity.

### Terminology used in this report

- **Pilot-grade platform:** the current AiFrogi product stage.
- **Reference bot:** the Webtechnosys bot used for the first production-validation cycle; currently CONFIGURED and pre-LIVE.
- **Controlled activation:** Super Admin enables the reference bot after readiness and installation gates pass.
- **Validated reference bot:** the reference bot after its seven-day monitored evidence window closes without an unresolved stop condition.

## 3. Product capabilities delivered

### Public frontend

- Classy black, white and Dark Antique Gold design system.
- Consistent navigation and footer across marketing pages.
- Homepage focused on intelligent AI business bots rather than WhatsApp-only automation.
- AI Bot portfolio pages for BusinessGPT, HotelGPT, ClinicGPT, DineGPT, PropertyGPT, eduGPT, FlowCart and Custom Bot.
- Dedicated WhatsApp API section separated from AI Bot positioning.
- AI Bot pricing: 15-day trial, ₹499 monthly Starter, ₹4,999 yearly Starter with ₹989 saving, and Custom/Enterprise route. Both prices are published in always-visible copy; the client-side selector updates the Starter card and passes the selected billing period into registration.
- Simplified installation and onboarding explanation.
- Security Compliance, Privacy, Terms, Help Center and installation resources.
- Current AiFrogi logo, favicon and mascot-based social preview metadata.
- Desktop and mobile responsive product presentation.

### Self-service delivery

- Registration and login flow.
- 15-day trial policy and lifecycle foundations.
- Embedded website widget delivery.
- Tenant-specific standalone web bot URL.
- Installation code for website delivery surfaces.
- Super Admin activation, pause and lifecycle controls.
- Shared bot runtime across embed and standalone surfaces.

### AI operations

- AI Operations inbox with conversation records.
- AI response and human-request lifecycle.
- Human takeover and conversation closure states.
- Lead capture with consent.
- Negative feedback and explicit incorrect-fact flagging.
- Knowledge gaps retained for governed review.
- Human-response and escalation foundations.

### Governed knowledge

- Website crawling of approved first-party sources.
- Upload support for structured and document knowledge.
- Document-to-atomic-claim staging.
- Automated claim validation and conflict detection.
- Named field approval.
- Customer-facing Preview Approval.
- Versioned publication and supersession.
- Expiry, reconfirmation, pause and conflict-family suppression.
- Minimum coverage and freshness readiness gates.
- Incorrect-fact flags pause affected claims.
- Two-hour acknowledgment and 24-hour resolution targets with escalation evidence.
- Publication and reconfirmation regression gate storing release evidence.

### Sovereign Intelligence

- Locked constitutional runtime rules.
- Intent classification for business, contact, identity, off-topic, human, sensitive and contextual follow-up requests.
- Rule 11 bounded clarification and semantic near-duplicate circuit breaker.
- Slot memory and context retention across relevant follow-ups.
- Off-topic interruption isolation.
- Grounded number, URL, availability and completed-action validation.
- Safe refusal, clarification, escalation and fallback dispositions.
- Decision-versus-observed-behaviour consistency checks.
- Tenant-bound evidence and feedback fingerprints.
- No silent self-training or automatic rewriting of approved knowledge.

### Persona system

Eight versioned persona packs share one governed contract while keeping category-specific behaviour:

| Persona | Implemented role | Material action dependency |
| --- | --- | --- |
| BusinessGPT | Service answers, qualification, lead capture, human follow-up | CRM/calendar only when live actions are required |
| HotelGPT | Guest questions and stay qualification without invented availability | PMS/channel manager for live rates, inventory and booking |
| ClinicGPT | Appointment journey with medical-emergency boundary | Calendar/clinic system for live slots and booking |
| DineGPT | Menu and reservation journey with allergen caution | Reservation/order system for live actions |
| PropertyGPT | Inventory qualification and site-visit preparation | CRM/inventory/calendar for live actions |
| eduGPT | Programme, fee and counselling journey with minor-data protection | Admissions/calendar system for live actions |
| FlowCart | Product and order journey with verified action controls | Store, inventory and payment connectors |
| Custom Bot | Governed client-specific workflow | Connector contract defined per scope |

### Universal bot repair system

- Every Knowledge workspace shows the three repair layers: Business Truth, Shared Intelligence and Connector/Action.
- Governed routing identifies signal, containment state, priority, owner, deadline and next action.
- Client Admin repairs tenant knowledge without code.
- Shared intent, context, persona and evidence defects route to engineering.
- Connector failures route to operations/engineering and writes remain disabled until certified.
- Internal guideline and public Help Center procedure are live.

## 4. Security and trust controls delivered

- Tenant-scoped server queries and visitor sessions.
- Signed visitor capabilities for widget feedback and flags.
- Role boundaries for Super Admin, Client Owner/Admin, Agent and Viewer.
- Agents and Viewers cannot approve governed knowledge.
- Password, OTP, payment-card and secret-sharing warnings.
- Signed Meta webhook enforcement and operational health checks.
- Approved-source attribution and customer-facing trust language.
- Human handover for sensitive, uncertain or prohibited requests.
- Audit and operational activity evidence for governed changes.

Formal ISO, SOC 2 or equivalent certification is not claimed.

## 5. Current verification evidence

### Deployment addendum — Intelligence Evidence Pipeline v1.0

Release `30bd5d2` adds a live measurement mechanism for retrieval candidates, selected and inferred-used claims, near misses, failure classification, Safe Resolution and anonymized replay intake. The production schema check confirms nine named evidence columns and the tenant-bound replay table; the exact field map is maintained in `docs/INTELLIGENCE_EVIDENCE_PIPELINE.md`.

This closes part of the former *measurement-mechanism* gap for Accuracy Engineering and Sovereign Intelligence. It does **not** raise the maturity bands yet: persona-level SRR, reviewed near-miss precision and replay-regression outcomes still require real-client volume and authorised labels.

The encrypted backup was checksum/decrypt/`pg_restore` verified before the first migration attempt. The ownership incident and corrective preflight are recorded in `docs/postmortems/2026-08-31-evidence-migration-ownership.md`.

The ownership preflight has two distinct evidence levels: `ADMIN_OWNER_REQUIRED` was verified through a live read-only production dry run; `RUNTIME_OWNER` passes automated regression tests but is not yet production-proven because the current production schema is consistently owned by `postgres`.

| Evidence | Current result |
| --- | --- |
| Production application build | Passed; 94 routes generated |
| TypeScript validation | Passed |
| Sovereign Intelligence suite | 48/48 passed |
| Common Sovereign release suite | Complete; zero-tolerance gates pass in automated evaluation |
| Production health | Database, session secret, public URL and webhook controls report healthy |
| Webtechnosys corrected journeys | Contact, location, callback and training-date checks passed against production runtime |
| Training link | Active HTTP 200 at `https://webtechnosys.com/training-booking/` |
| Published Webtechnosys claims | 6 published; 6 fresh; 0 conflicts; 0 unsigned; 0 pending previews; 0 open flags. These claims currently cover 3 of the 10 readiness topics (30%); see Section 6. |

Automated test passes prove implemented controls. They do not prove real-world answer accuracy across future client language.

## 6. Webtechnosys reference-bot status

| Gate | Result |
| --- | --- |
| Organisation | ACTIVE |
| Bot profile | CONFIGURED, not yet LIVE |
| Published claims | 6 |
| Freshness | 100% |
| Conflicts | 0 |
| Unsigned claims | 0 |
| Pending previews | 0 |
| Open incorrect-fact flags | 0 |
| Category coverage | 30% |
| Required coverage | 80% |
| Overall readiness | BLOCKED by coverage only |

Seven BusinessGPT topics remain uncovered:

1. What services do you provide?
2. How does a project start?
3. What does the service cost?
4. How long does delivery take?
5. What support is available?
6. What cannot the bot confirm?
7. How is customer data handled?

Coverage is calculated against a ten-question BusinessGPT readiness bank, not by dividing the number of published claims. The current six claims collectively cover three of those ten required topics. Publishing approved answers that each cover five currently missing bank questions would move coverage from 3/10 to 8/10, or 80%. One claim may cover multiple bank questions, while a valid claim outside the bank may add no coverage. Management should prefer completing all seven missing topics for a stronger reference implementation.

No live connector is required for the initial Webtechnosys scope of answering, qualifying, capturing leads and handing over to humans.

## 7. Remaining work — Bucket 1: complete now

This bucket is narrow and launch-specific.

1. Approve and publish the seven missing Webtechnosys BusinessGPT topics.
2. Confirm the readiness gate reports at least 80% coverage and remains at 95%+ freshness with zero conflicts, unsigned claims, pending previews and open flags.
3. Retest the top customer journeys: services, project start, pricing boundary, timeline boundary, support, contact, training, callback, prohibited commitments and privacy.
4. Install or confirm the widget on the controlled Webtechnosys production page.
5. Use Super Admin to move the bot from CONFIGURED to LIVE only after the readiness and installation gates pass.
6. Monitor every rated response, fallback, gap, human request and flag for the first 48 hours.
7. Complete a seven-day evidence review before treating the reference bot as validated.

Bucket 1 exit condition: Webtechnosys answers approved questions, captures consented demand, hands over safely, can be paused, and produces seven days of reviewable evidence without an unresolved safety blocker.

### Monitoring stop and hold conditions

**Pause the complete bot immediately** when any zero-tolerance event is confirmed: cross-tenant disclosure, secret exposure, unverified completed booking/payment/order claim, prohibited high-risk guidance, inability to stop or hand over, or a systemic circuit-breaker failure affecting multiple intents.

**Contain the claim or journey and hold expansion** when an incorrect-fact flag is opened, the same material failure repeats twice within 24 hours, a human request is not routed, or a knowledge conflict/expiry remains retrievable. Claim-level containment is preferred when unaffected bot capabilities remain safe.

**Do not close the seven-day gate** while a P0 event is unresolved, a fact flag has exceeded its 24-hour resolution target, decision-versus-behaviour consistency is below 100%, a zero-tolerance gate is below 100%, readiness falls below 80% coverage or 95% freshness, or required human handover evidence is missing. With fewer than 20 rated conversations, helpfulness is reported descriptively and is not treated as a statistically reliable percentage.

## 8. Remaining work — Bucket 2: after 3–5 clients

These items need real usage patterns and should not be guessed now.

- Calculate composite Safe Resolution Rate from real production conversations.
- Separate synthetic/test evidence from real-client operational evidence in management reporting.
- Cluster semantically similar feedback and knowledge gaps within each tenant.
- Generate correction suggestions as drafts only; retain full client approval.
- Tune persona language and retrieval ranking from real category phrasing.
- Calibrate fallback and human-handover thresholds from actual outcomes.
- Measure support load and failure distribution by model, knowledge, connector, conversation state and infrastructure.
- Certify live connectors client by client before enabling write authority.
- Run sustained load, connector degradation, recovery and rollback exercises at the usage levels actually observed.
- Reassess Starter allowances, connector pricing and support economics using measured cost-to-serve.
- Begin formal security/compliance certification planning when commercial volume justifies it.

Mechanism reference: `AiFrogi-Governed-Improvement-Corrections-v1.0.md`. Operational repair reference: `AiFrogi-Universal-Bot-Repair-Guideline-v1.0.md`.

## 9. Claims management may make now

Approved positioning:

> AiFrogi provides governed AI business conversations using approved knowledge, controlled actions, human handover and measurable evidence.

Management should not yet claim:

- 94.5% real-world production accuracy;
- unrestricted autonomous bookings, payments or orders;
- enterprise-scale unattended onboarding;
- formal ISO or SOC certification;
- zero-error operation;
- proven performance across hundreds of clients.

## 10. Principal risks and controls

| Scope | Risk | Current control | Remaining evidence |
| --- | --- | --- | --- |
| Webtechnosys reference bot | Client approves wrong information | Field approval, Preview Approval, flags, versioning and responsibility trail | Real owner approval behaviour |
| Webtechnosys reference bot | Hallucinated commercial fact | Approved context, claim validator and safe fallback | Real-language production sample |
| Webtechnosys reference bot | Repetitive clarification | Rule 11 and semantic circuit breaker | Real-client loop rate |
| Platform and future action bots | False booking/payment confirmation | Connector authority, idempotency and read-back requirements | Per-connector certification; no connector write is in the initial Webtechnosys scope |
| Platform | Cross-tenant leakage | Tenant-scoped queries, signed sessions and isolation tests | Continued multi-client monitoring |
| Platform | Support cost grows with installs | Failure attribution and escalation ladder | Actual support-load distribution |
| Management | Overstated maturity | Evidence bands and explicit claim limitations | Maintain discipline as sales volume grows |

## 11. Management decisions requested

1. Approve Webtechnosys as the reference production-validation bot.
2. Assign one Webtechnosys user holding the Client `OWNER` or `ADMIN` role to approve the seven missing topics. Agent and Viewer roles cannot approve them.
3. Keep initial authority to Answer, Clarify, Recommend, Capture Lead and Human Handover.
4. Do not require a connector for the first Webtechnosys launch.
5. Approve one-at-a-time onboarding for the first 3–5 clients.
6. Review the first 48-hour and seven-day evidence reports before expanding scope.

## 12. Overall conclusion

AiFrogi has a credible, differentiated pilot-grade product with stronger governance than an ordinary chatbot implementation. The remaining immediate work is business-content completion and production validation, not foundational reconstruction. Enterprise readiness should rise only after 3–5 clients demonstrate measurable accuracy, reliable handover, controlled support demand and safe connector operation.
