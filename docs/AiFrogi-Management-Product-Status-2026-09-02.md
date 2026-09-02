# AiFrogi Management Product Status

Reporting date: 2 September 2026  
Revision: 1.0  
Production release: `e0ab045`  
Product stage: Controlled pilot-grade SaaS  
Management decision: Complete and activate Webtechnosys as the reference bot, then onboard additional pilots one at a time.

## 1. Reporting method

This report uses evidence bands only. Decimal ratings and percentage-complete estimates are intentionally excluded because current production volume does not support that precision.

Evidence states:

- **Implemented:** the capability exists in the deployed source.
- **Automatically verified:** a repeatable test or build verifies a defined control.
- **Production-proven:** the capability has completed its intended journey with real client activity and retained evidence.
- **Externally assured:** an independent party has assessed the control.

A capability does not move to a higher band merely because its screen, API or measurement instrument exists.

## 2. Executive position

AiFrogi has a functioning multi-tenant application, public website, customer workspace, Super Admin operations, governed knowledge lifecycle, Sovereign Intelligence runtime, feedback containment, billing and support foundations, website delivery and controlled Excel onboarding.

The product's primary limitation is now evidence, not missing architecture. It is suitable for controlled pilots with close monitoring. It is not yet proven for unattended mass-market onboarding, live transactional authority across every persona, or enterprise-scale operation.

| Area | Evidence band | Verified basis | Evidence still required |
| --- | --- | --- | --- |
| Public frontend | Strong pilot | Production build, public routes and current install/download HTTP checks | External usability, accessibility and broader real-device evidence |
| Customer workspace | Strong pilot | Deployed onboarding, intelligence, installation and tenant-scoped APIs | First-client completion evidence and observed usability |
| Super Admin | Pilot-ready | Deployed customer, onboarding, billing, support and intelligence operations | Daily operator journeys across the first pilots |
| Backend platform | Strong pilot | Multi-tenant services, role checks, builds and health checks | Sustained multi-client workload history |
| Sovereign Intelligence | Strong pilot | Common, persona and Rule 11 automated suites; evidence pipeline | Real-language persona SRR and reviewed replay results |
| Knowledge governance | Strong pilot | Atomic claims, conflicts, approval, preview, publication, pause and expiry controls | Client approval behaviour and freshness history |
| Billing | Implemented; pilot verification pending | Subscription, Razorpay verification and admin operations exist | One complete real payment, reminder, suspension and recovery journey |
| Support | Implemented; pilot verification pending | Ticket, response, status and access-control paths exist | One complete customer-to-admin-to-email resolution journey |
| Security | Pilot-ready | Tenant, role, session, secret and webhook controls | Independent penetration test and formal assurance |
| Reliability | Pilot-ready with monitoring | Health endpoints, backup/deploy process and failure controls | Sustained load, recovery exercise and live connector history |
| Enterprise scale | Evidence incomplete | Architecture exists | Multiple real-client datasets and operational history |

## 3. Deployed frontend and delivery

Implemented:

- Responsive AiFrogi marketing site and product navigation.
- AI Bot portfolio and a separate optional WhatsApp product path.
- Published 15-day trial and Starter/Enterprise pricing presentation.
- Self-serve and assisted installation guidance.
- Embedded widget and tenant-specific standalone bot surfaces using the shared website-bot runtime and property identity.
- Security, privacy, terms, help, resources and founder routes.

Verified in release `e0ab045`:

- Production build generated 97 routes.
- `/install-ai-bot` returned HTTP 200.
- The onboarding workbook returned HTTP 200.

Not yet production-proven:

- Delivery-surface behavioural parity across a statistically useful set of real conversations.
- First-time-user completion rate.
- Broad accessibility and real-device coverage.

The published yearly pricing value should be visually confirmed in an interactive browser acceptance run because static fetch behaviour may not exercise the client-side selector.

## 4. Customer workspace and onboarding

Implemented:

- Registration, activation, login and logout.
- Tenant workspace and member roles.
- Bot profile, Intelligence, installation and human-handover surfaces.
- Installation script, iframe and standalone URL.
- Feedback, explicit incorrect-fact flags and Improve My Bot workflow.
- Customer billing and support areas.
- Controlled XLSX onboarding import.

The XLSX importer validates type, size and template limits; rejects formulas and credential-like content; provides a preview; updates permitted profile fields; stages FAQs as atomic claims; and never publishes imported answers automatically. The same parser is used by self-service customers and Super Admin.

Verification:

- Parser tests: 3/3 passed.
- TypeScript passed.
- Workbook rendered and visually inspected.
- Customer and Super Admin import routes are present in the production build.

Evidence gap:

- A real client has not yet completed the entire workbook-to-approved-live-bot journey.

## 5. Super Admin operations

Implemented surfaces include Command Center, customer lifecycle, two onboarding tracks, Intelligence Operations, Message Matrix, Billing Operations, Support and bot lifecycle controls.

Super Admin can configure a bot, import onboarding data, inspect readiness, manage installation, pause or suspend service, maintain commercial records and respond to support tickets.

These capabilities are deployed but not all are production-proven. The next evidence run must record, per journey:

1. Actor and tenant.
2. Starting state.
3. Action performed.
4. Resulting state.
5. Audit/activity record.
6. Customer-visible outcome.

## 6. Sovereign Intelligence and knowledge

Implemented controls include tenant-bound retrieval, intent classification, approved-knowledge grounding, bounded clarification, semantic repeat detection, slot memory, off-topic isolation, safe refusal and handover, action verification, claim conflict handling, preview approval, publication gates, expiry and evidence capture.

Current automated evidence includes:

- Rule 11 stress: 48/48 in the recorded evaluation.
- Critical persona smoke: 56/56 after correction of discovered defects.
- More than 195 cases across the recorded sovereign test estate.
- Zero recorded decision-versus-behaviour mismatches in the referenced run.
- Zero cross-tenant leakage in the referenced connector sample.

These are synthetic and controlled results. They do not establish a real-world accuracy percentage.

## 7. Billing, support and connectors

Billing and support are implemented foundations, not yet fully production-proven operations.

Before calling billing proven, complete and retain evidence for:

- Real Razorpay payment and signature verification.
- Plan activation and customer/admin payment record.
- Trial and renewal reminder.
- Grace period, suspension and payment-based restoration.
- Data-retention transition using a disposable tenant.

Before calling support proven, complete and retain evidence for:

- Customer ticket creation.
- Admin response and email delivery.
- Customer reply/thread continuity.
- Resolution and closure.
- SLA and access audit evidence.

Knowledge-based bots can pilot without live write connectors. A bot must not claim a completed booking, appointment, payment, order or inventory result until that connector is independently certified with permission, idempotency, read-back and failure evidence.

## 8. Launch gate

The platform is cleared to prepare the first controlled pilot. The reference bot is not validated until its current onboarding cycle completes.

Required sequence:

1. Import the real Webtechnosys workbook.
2. Review and approve its staged claims and conversational previews.
3. Meet at least 80% required-topic coverage and 95% freshness with no unresolved conflicts or flags.
4. Install and detect the website widget.
5. Run defined customer-journey acceptance tests.
6. Activate through Super Admin.
7. Review all conversations for 48 hours.
8. Complete a seven-day evidence review before expanding risk.

## 9. Management conclusion

AiFrogi is a **strong controlled-pilot platform** with an **enterprise evidence gap**.

Management may state:

> AiFrogi provides governed AI business conversations using approved knowledge, controlled actions, human handover and measurable evidence.

Management should not yet claim a real-world 94.5%/95.5% accuracy rate, enterprise-scale unattended operation, unrestricted transactional autonomy, zero-error performance, or formal security certification.

The next maturity movement must come from completed real-client journeys and retained operational evidence—not from additional screens or another subjective score.
