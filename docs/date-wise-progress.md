# AiFrogi Date-wise Product Progress

Purpose: append-only product-development record for tracking what was designed, implemented, verified, deployed and still pending. Each entry must separate proven production evidence from planned or pilot-grade capability. Do not rewrite earlier results to make later progress appear stronger.

## Status vocabulary

- **Designed:** agreed architecture or documented rule; implementation may not exist.
- **Implemented:** present in the application and covered by proportionate local checks.
- **Deployed:** present in the identified production release.
- **Production-evidenced:** exercised against the running production system with recorded results.
- **Pilot-grade:** suitable for a small, monitored real-client rollout.
- **Scale-grade:** supported by sustained real-client, load, recovery and operational evidence. AiFrogi has not reached this status yet.

---

## 2026-08-29 - Product consolidation and premium frontend

### Direction locked

- AiFrogi positioned as the AI Business Automation vertical of Webtechnosys.
- Product separated into AI Business Bots and WhatsApp API automation.
- Bot category, delivery channel and operating authority established as independent concepts.
- Product portfolio established around BusinessGPT, HotelGPT, ClinicGPT, DineGPT, eduGPT, PropertyGPT, FlowCart and Custom Business Bot.
- Website and application visual direction changed to black, white and Dark Antique Gold.

### Product experience implemented

- Common marketing header and footer structure.
- AI Bot navigation and dedicated product pages.
- Website widget modes for AI responding, human requested, human joined and conversation closed.
- Human-contact and safety notices.
- Mobile hero and navigation corrections.
- AI operations inbox, feedback, handover and onboarding foundations.

### Position at end of day

- Strong visual and functional foundation.
- Persona and intelligence rules required deeper engineering before real-client activation.

---

## 2026-08-30 - Sovereign Intelligence, persona sandboxes and release evidence

### Sovereign Intelligence implemented

- Constitution version 1.1 and category blueprint structure.
- Approved-source answer governance.
- Intent separation for business, identity, contact information, off-topic, sensitive and contextual follow-up questions.
- Category-specific safety boundaries.
- Bounded clarification and Rule 11 circuit breaker.
- Safe fallback and human escalation.
- Connector authority, idempotency and read-back rules.
- Knowledge verification pipeline and blocker-based grading framework.
- Answer feedback and flagging foundation.

### Eight isolated demo personas implemented

- BusinessGPT
- ClinicGPT
- HotelGPT
- DineGPT
- eduGPT
- PropertyGPT
- FlowCart
- Custom Business Bot

Each demo uses clearly synthetic knowledge and mock connectors. No demo transaction is represented as real.

### Production defects discovered and corrected

- Persona routing incorrectly treated some catalogue requests as order actions.
- Some DineGPT and HotelGPT evidence dispositions could be mislabeled.
- A third repeated customer request could restart clarification after escalation.
- Previous action context could override an off-topic refusal.
- Active customer task state now survives an off-topic interruption.
- Training booking intent now selects the active training-booking link rather than the unrelated hotel booking-engine path.

### Production evidence achieved

- Critical eight-persona smoke matrix: **56/56 passed**.
- Live Rule 11 multi-turn stress: **48/48 passed**.
- Evidence-integrity classified sample at that point: **96 records, 0 decision-behaviour mismatches**.
- Channel and website controls: **50/50 passed**.
- Sovereign Intelligence suite: **41/41 passed**.

### Release position

- Controlled five-client canary became technically reasonable.
- Results did not establish 100% real-world accuracy or enterprise certification.

---

## 2026-08-31 - Client readiness, branding and current product assessment

### Deployed release

- Production release: **`0926257`**.
- Production service reported online and ready.
- Health checks reported database, session configuration, public URL, Meta signature configuration and legacy inbound token as healthy.

### Client onboarding readiness

- Created a five-page client onboarding prerequisites PDF.
- Guide covers business identity, selected persona, approved knowledge, active website links, brand photos, Google location, connector ownership, installation access, security boundaries, preview approval and final handover.
- Added a PDF-icon download card to `/install-ai-bot`.
- Published the downloadable guide at `/downloads/AiFrogi-Client-Onboarding-Prerequisites.pdf`.
- Established the 15-day trial preparation and activation explanation.

### Branding consolidation

- Added current monochrome black-on-light and white-on-dark AiFrogi logo assets.
- Updated website, application, onboarding and email-template references to use the appropriate monochrome asset.
- Removed the obsolete coloured logo asset from the current source tree; it remains recoverable through Git history.

### Fresh verification evidence

- Channel and website controls: **50/50 passed**.
- Sovereign Intelligence tests: **41/41 passed**.
- TypeScript verification: **passed**.
- Production build: **passed**.
- Production Sovereign Answer Evidence records: **270 total**.
- Independently classified evidence: **96 records**.
- Classified decision-behaviour mismatches: **0**.
- Legacy/unclassified evidence remains excluded from the consistency rate rather than being guessed retroactively.

### Evidence-based ratings

| Area | Rating | Current interpretation |
|---|---:|---|
| Frontend and product experience | **8.5/10** | Modern, responsive and commercially credible across marketing, bot pages, widget, onboarding and admin surfaces. |
| Backend platform | **8.2/10** | Tenant workspaces, roles, lifecycle, evidence, knowledge, inbox, feedback, installation detection and demo connectors are functional. |
| Sovereign Intelligence core | **8.4/10** | Strong governed foundation with category controls, bounded resolution, evidence consistency and action authority. |
| Security foundation | **7.8/10** | Meaningful controls exist; formal certification and broader adversarial evidence remain incomplete. |
| Reliability and observability | **7.5/10** | Safe failure and evidence mechanisms exist; sustained load, chaos and recovery history remain limited. |
| Commercial pilot readiness | **8.0/10** | Suitable for five closely monitored clients. |
| Enterprise-scale readiness | **6.8/10** | Real-client history, provider-specific connectors, SLO evidence and recovery drills are still required. |
| **Overall product** | **8.1/10** | Credible controlled-pilot SaaS; not yet unattended scale-grade SaaS. |

### What is working now

- Eight governed AI Bot personas.
- Website widget and tenant-specific standalone bot.
- Approved knowledge retrieval and active-link handling.
- Contact information, identity, contextual and off-topic routing.
- Human handover, feedback and answer flagging.
- AI operations inbox and Sovereign Intelligence evidence dashboard.
- Business onboarding, knowledge input and preview foundations.
- Website installation code, detection and Super Admin live/pause/delete lifecycle.
- Synthetic demo connector journeys with idempotency and safe failure.
- Fifteen-day trial foundation and client preparation material.

### Current limitations - do not overclaim

- Test-suite pass rates are not the same as real-world accuracy.
- No promise of 100% answer accuracy.
- No unrestricted automatic write actions through unverified client connectors.
- No formal enterprise security certification yet.
- No evidence yet for unattended onboarding of hundreds of clients.
- Production metrics require a larger sample of real customer conversations.

### Next fixed stage

Do not add unrelated features before completing this sequence:

1. Select one low-risk real client.
2. Complete business-owner knowledge and preview-answer approval.
3. Install the widget on staging or a controlled production page.
4. Activate answer, qualification and lead-capture mode first.
5. Keep material write actions behind human approval.
6. Monitor every conversation for the first 48 hours.
7. Review helpfulness, fallbacks, unresolved questions, handovers, loops and connector failures after seven days.
8. Correct knowledge/persona gaps and rerun the same release gates.
9. Repeat carefully for up to five pilot clients.
10. Decide whether to expand only from recorded pilot evidence.

### Commercial wording approved for the current stage

> AiFrogi provides governed AI business conversations using approved knowledge, controlled actions, human handover and measurable evidence.

### Current stage conclusion

AiFrogi is beyond prototype stage and is a **credible pilot-grade SaaS product**. The next increase in rating must come primarily from real-client evidence, verified connectors, operational response and sustained reliability - not from additional presentation features.

---

## 2026-08-31 - AI Bot pricing and commercial terms

### Implemented
- Replaced the public pricing page's WhatsApp-first plans with AI Bot pricing.
- Added the 15-day free trial, ₹499 monthly Starter and ₹4,999 yearly Starter toggle.
- Added Custom / Enterprise email and WhatsApp contact routes.
- Added India/global estimates and an interactive calculator for Google Sheets, Google Calendar, e-commerce and PMS/channel-manager connectors.
- Separated AiFrogi subscription, connector implementation, provider usage, taxes and optional monitoring costs.
- Expanded terms for renewals, cancellation, connector milestones, client/provider dependencies, refunds, fair use and third-party fees.

### Verification evidence
- TypeScript: passed.
- Channel and commercial tests: 52/52 passed.
- Production build: 93 routes compiled using the webpack production builder.
- Browser QA: desktop and 390 px mobile passed with no horizontal overflow or console errors; monthly/yearly and India/global controls worked.

### Commercial guardrails
- ₹499 is recorded as an introductory one-bot launch offer, not an unlimited enterprise entitlement.
- Connector numbers are planning estimates pending scope and API-access review.
- Provider/API usage remains separately billable where applicable.

---

## 2026-08-31 - Trial and allowance consistency gate

### Implemented
- Standardized active website, onboarding, verification, documentation, video captions and guidebook material to the deliberate 15-day trial policy.
- Replaced vague Starter fair-use wording with published Trial and Starter allowances that match the server-owned billing catalogue.
- Stated that usage is visible and no automatic overage fee is charged without prior agreement.
- Regenerated and visually verified the 29-page project guidebook.
- Rebuilt the product-tour video with a readable current logo and a 15-day outro.

### Verification evidence
- Repository audit leaves no stale 30-day trial reference; the remaining 30-day text concerns data-deletion handling only.
- Pricing regression test checks published allowances and rejects the former vague fair-use phrase.
- Guidebook text extraction confirms 15-day wording and no 30-day trial wording.
- Guidebook pages and product-video outro were rendered and visually inspected.

---

## 2026-08-31 - Optional WhatsApp pricing layer

### Implemented
- Added Standard and Premium WhatsApp channel cards beneath the AI Bot plans.
- Kept WhatsApp quarterly billing separate from the AI Bot monthly/yearly selector.
- Added the shared ₹4,500 setup strip, WhatsApp-specific connector ranges and the Meta cost-calculator route.
- Clarified that WhatsApp connector ranges cover limited channel-adapter scope while broader end-to-end integrations remain separately scoped.

### Verification evidence
- TypeScript passed.
- Channel and commercial tests: 53/53 passed.
- Production build: all 93 routes compiled.
- Desktop and 390 px mobile browser QA passed without overflow or console errors.

---

## 2026-08-31 - Governed repair and Webtechnosys reference-bot review

### Implemented
- Added publication and reconfirmation regression gates with stored evidence.
- Added governed improvement routing and tenant-bound feedback normalization.
- Published six Webtechnosys contact, location, callback, training and service claims through the full approval lifecycle.
- Corrected universal callback and specific-date intent handling.
- Added the universal three-layer bot repair system, Knowledge workspace guide and public Help Center procedure.
- Replaced the legacy dashboard social image with the AiFrogi mascot.

### Verification evidence
- Production build: 94 routes.
- Sovereign Intelligence: 48/48 passed.
- Production health: healthy.
- Webtechnosys contact, location, callback and training-date journeys: passed.
- Webtechnosys knowledge: six published and fresh claims; zero conflicts, unsigned claims, pending previews or open flags.

### Remaining limitation
- Webtechnosys BusinessGPT coverage is 30%, below the 80% activation gate. Seven named topics remain and should be completed before Super Admin activation.
- Enterprise readiness still depends on evidence from 3–5 real clients.

### Management report
- See `docs/AiFrogi-Management-Product-Status-2026-08-31.md`.

---

## 2026-08-31 - Intelligence Evidence Pipeline v1.0

### Implemented
- Added per-turn retrieval candidates, normalized scores, selected claims, inferred used claims and near-miss evidence.
- Added governed failure classification and Safe Resolution calculation.
- Added persona-pack identity to every new evidence record and persona-level SRR reporting.
- Added anonymized replay-case creation from negative visitor feedback.
- Expanded the Super Admin Sovereign Intelligence command center with near-miss, replay and persona metrics.
- Documented the evidence boundary between measurable retrieval traces and formal recall.

### Verification evidence
- New Intelligence Evidence Pipeline tests cover synonym retrieval, candidate-versus-used evidence, failure separation, safe-resolution rules and replay redaction.
- Existing Rule 11 multi-turn and decision-consistency tests remain part of the regression run.
- Production release `30bd5d2` is live; encrypted backup verification completed before migration, and the additive schema plus application privileges passed post-deployment checks.
- The nine new evidence columns are explicitly reconciled in `docs/INTELLIGENCE_EVIDENCE_PIPELINE.md`.
- Migration ownership root cause, recovery and rollback evidence are recorded in `docs/postmortems/2026-08-31-evidence-migration-ownership.md`.
- A reusable ownership preflight now routes known production drift through an explicit owner path before Prisma attempts schema changes.

### Remaining limitation
- Replay cases require authorised labels and real-client samples before they can become statistical recall or threshold-tuning evidence.
- No automatic prompt or knowledge mutation is permitted from feedback.

## 2026-09-02 - Governed Excel onboarding import

### Implemented
- Added one tenant-bound XLSX import engine shared by customer self-serve onboarding and Super Admin assisted onboarding.
- Added validation and preview before mutation, formula and credential rejection, template size limits, and explicit confirmation.
- Imported business profile fields remain governed; structured FAQs are staged as atomic claims and are never auto-published.
- Added Super Admin and customer workspace import interfaces and clarified the public installation page.
- Reworked the downloadable onboarding workbook with separate Approved FAQs and Approved Sources sheets.

### Verification evidence
- TypeScript: passed.
- Workbook parser tests: 3/3 passed, covering valid import, unchanged template examples, and credential rejection.
- Production build: passed with 97 generated application routes.
- Workbook rendered and visually inspected after export.

### Remaining limitations
- Arbitrary legacy XLS/XLSX knowledge files are not accepted; only the controlled onboarding template is supported.
- Approved source references do not trigger crawling or publication. The customer or operator must upload/review source documents through Intelligence.

### Next fixed stage
1. Run the first real Webtechnosys workbook through preview and confirm the staged claims in Intelligence.
2. Measure first-user completion time and correct any unclear field before onboarding the remaining pilots.

---

## 2026-09-02 - Management reporting discipline correction

### Implemented
- Replaced mixed decimal ratings, completion percentages and evidence bands with one evidence-band reporting model.
- Separated deployed implementation, automated verification, production proof and external assurance.
- Added explicit evidence requirements for Super Admin, billing, support, delivery-surface parity and reference-bot validation.

### Verification evidence
- Management report: `docs/AiFrogi-Management-Product-Status-2026-09-02.md`.
- Report retains the deployed release and automated test evidence without converting synthetic results into a real-world accuracy claim.

### Remaining limitations
- The revised report itself does not raise any maturity band. Production journeys must produce the missing evidence.
- The permanent reporting standard is recorded in `docs/management-evidence-reporting-rule.md` and must govern future management assessments.

---

## 2026-09-02 - Public bot connector guide

### Implemented
- Added a category-by-category connector guide to the AI Bot installation page.
- Separated capabilities available before a connector from live actions that require a verified external system.
- Added a secure setup warning so customers do not place API keys, passwords or OTPs in the onboarding workbook.

### Verification evidence
- Production build and public-page verification are required with the release.

---

## Template for the next entry

```markdown
## YYYY-MM-DD - Short milestone name

### Implemented
- 

### Deployed
- Release:

### Verification evidence
- Test/gate:
- Production sample:

### Defects discovered and corrected
- 

### Product rating change
- Previous:
- Current:
- Evidence supporting the change:

### Remaining limitations
- 

### Next fixed stage
1. 
```
