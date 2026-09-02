# AiFrogi Pre-Pilot Launch Audit

Audit date: 2 September 2026  
Audited production release: `a9c9562`  
Reference workspace: Webtechnosys AI Agency  
Decision: **Platform ready for controlled preparation; reference bot not yet authorised to go live.**

## 1. Decision boundary

Two decisions must remain separate:

1. The AiFrogi platform is healthy enough to prepare and supervise a controlled pilot.
2. A specific client bot may serve real users only after its own knowledge, installation and acceptance gates pass.

The platform currently passes decision 1. Webtechnosys currently fails decision 2 because its newly onboarded workspace contains no published approved knowledge and has not detected an installation.

## 2. Evidence completed

### Code and governed intelligence

- ESLint: zero errors; 16 non-blocking unused-code warnings.
- TypeScript: passed.
- Complete core gate: 170/170 passed.
- Coverage includes website lifecycle, visitor sessions, feedback, explicit fact flags, billing, support, trial suspension, tenant boundaries, onboarding, all eight persona categories, Rule 11 loop protection, safe refusal, connector authority and evidence consistency.
- Client bundle secret scan: eight secret markers absent.
- Appointment connector contract and template verification: passed.
- Meta webhook: signed verification configured; unsigned request rejected with HTTP 403.
- Unauthenticated security probes: five protected operations correctly returned HTTP 401.
- Deeper cross-tenant live tests remain withheld because dedicated staging test users are not configured.

### Public experience

- All 36 sitemap URLs returned successful HTTP responses.
- Homepage, pricing, installation, portfolio, seven named bot pages, security and legal pages were inspected in a real browser.
- No horizontal overflow was found on the inspected desktop or mobile routes.
- Mobile navigation opens and exposes the approved top-level routes.
- Monthly/yearly pricing interaction correctly renders `₹4,999 per year` after selection.
- Connector download renders with white text on a dark background and resolves to the published PDF.

### Production operations

- Readiness endpoint: healthy; database, session secret, public URL, Meta signature and legacy inbound token checks pass.
- PM2: online, zero unstable restarts in the current run.
- Nginx syntax: valid.
- Storage: 70% used, approximately 30 GB free.
- Memory: approximately 5.4 GiB available at audit time.
- Latest encrypted backup checksum: valid.
- Subscription/automation job runs every minute and currently reports no failed jobs.
- Stateful readiness monitoring was missing and was enabled every two minutes; immediate check passed.

## 3. Defects discovered and corrected

1. The standard test command omitted admin and category-onboarding tests. A new `test:core` command now runs all 170 core tests, and `verify:all` includes it.
2. Two acceptance tests still expected older approved UI wording. They now validate the current `Bot onboarding` and `Command Center` journeys.
3. The category acceptance test did not apply required persona capabilities before parsing Restaurant, Property and Education profiles. It now tests the same governed normalization used by the product.
4. A reusable read-only `audit-pilot-readiness.ts` report now exposes bot, knowledge, installation, connector, evidence, feedback and subscription readiness without mutating client data.
5. Production readiness monitoring is now scheduled every two minutes. PM2 remains responsible for process restart; the monitor records readiness changes.

## 4. Webtechnosys reference-bot result

Current production state:

- Organization: `ONBOARDING`.
- Bot: Business Assistant / `BUSINESS_AI` / website channel.
- Bot status: `INSTALLATION_READY`.
- Published claims: 0.
- Required-topic coverage: 0% of 10 topics.
- Freshness: 0% because no claim is published.
- Conflicts, unsigned published claims, pending previews and open answer flags: 0.
- Installation detected: no.
- Live: no.
- Real Sovereign Intelligence evidence: 0 conversations.
- Feedback and replay cases: 0.
- Trial: active until 16 September 2026.
- CRM or Google Sheets connector: requested, not live. This does not block a knowledge-and-handover pilot; the bot must not claim external CRM delivery.

The earlier six-claim Webtechnosys evidence belonged to the retired workspace. It must not be reused as proof for this newly onboarded workspace.

## 5. Go-live blockers

### B1 — Approved knowledge

Upload/import real Webtechnosys information, convert it into atomic claims, complete field approval and conversational preview approval, then publish. Minimum launch gate: 80% topic coverage, at least 95% freshness, zero unresolved conflicts, zero unsigned published claims, zero pending previews and zero open answer flags.

### B2 — Installation detection

Install the generated widget on the approved Webtechnosys page or use the standalone pilot URL, then confirm detection in Super Admin.

### B3 — Controlled acceptance conversation

Before public traffic, test identity, services, project start, required information, pricing boundary, timeline boundary, support, contact, prohibited commitments, data handling, an irrelevant weather question, a contextual return after that interruption, and human handover.

### Closed — TLS renewal

The failing manual wildcard lineage was replaced, after explicit approval, by an automatically renewable certificate covering `aifrogi.com`, `www.aifrogi.com` and `app.aifrogi.com`. The origin serves the new certificate through 1 December 2026, Nginx validation passed, application readiness remained healthy, and the unattended Certbot renewal simulation succeeded. The obsolete manual renewal entry and original Nginx configuration remain in `/var/backups/aifrogi/tls-20260902` for recovery.

## 6. Important non-blocking gaps for the first pilot

- No alert webhook is configured. The new monitor logs state but cannot notify an operator externally.
- Formal staging identities for two tenants and a limited user are missing, so the deeper live role/isolation suite was not executed.
- Billing requires one real payment-to-activation-to-record journey before being called production-proven.
- Support requires one customer ticket-to-email-to-resolution journey before being called production-proven.
- Connector actions require separate certification; the first BusinessGPT pilot should remain knowledge, lead capture in AiFrogi, and human handover only.
- Real Safe Resolution Rate cannot be stated until real conversations exist.

## 7. Exact first-pilot sequence

1. Import the Webtechnosys onboarding workbook or approved source documents.
2. Confirm the ten required BusinessGPT topics and resolve gaps.
3. Field-approve and preview-approve every intended claim.
4. Publish only after the KB gate passes.
5. Test the twelve acceptance journeys listed in B3.
6. Install the widget and confirm installation detection.
7. Run the read-only pilot audit again and retain the JSON result.
8. Authorise live service in Super Admin.
9. Review every conversation, decision, source and feedback item for the first 48 hours.
10. Review seven-day SRR, false-confidence, false-caution, gaps, flags, handovers and response SLA before onboarding the next pilot.

## 8. Automatic correction policy

AiFrogi must self-detect and safely contain operational failures, but it must not silently rewrite client truth.

- Process failure: PM2 restart and readiness monitoring.
- Transient model/connector failure: bounded retry, circuit breaker and degraded disclosure.
- Missing knowledge: record a gap; clarify, refuse or hand over.
- Negative feedback: create an improvement signal and replay case.
- Explicit incorrect-fact flag: pause the affected claim immediately.
- Correction: authorised client/Admin review, regression test, versioned publish and monitored rollout.
- Unresolved conflict: suppress the claim rather than choosing automatically.

This is governed improvement, not uncontrolled self-learning.

## 9. Final management position

**Conditional go:** continue Webtechnosys preparation immediately.  
**No-go:** do not expose the bot to real client traffic until B1–B3 pass.  
**Infrastructure:** automatic certificate renewal is verified and no longer blocks the pilot.

After B1–B3 pass, start with a monitored website-only pilot and no unverified external write action.
