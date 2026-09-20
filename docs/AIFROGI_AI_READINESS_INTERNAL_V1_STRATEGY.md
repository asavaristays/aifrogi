# AiFrogi AI Readiness — Internal v1 Strategy

**Status:** Approved implementation baseline  
**Audience:** Existing AiFrogi hotel tenants only  
**Product boundary:** A separate commercial product line inside the AiFrogi platform; not a separate codebase, login, database, or security model.

## 1. Outcome

AiFrogi AI Readiness measures, improves, verifies, and monitors whether a hotel is prepared for AI-mediated discovery and customer service. Internal v1 must prove one outcome:

> A hotel receives evidence-led issues, approves practical fixes, and demonstrates a verified improvement on the same scoring rubric.

This release does **not** certify a hotel, promise visibility in ChatGPT/Google, rank hotels, or claim that a hotel is AI-recommended.

## 2. First-release scope

Internal v1 applies only to authenticated, existing hotel tenants and covers two public R.O.O.M.S. pillars:

| Pillar | v1 purpose | Deterministic evidence |
|---|---|---|
| Readable Data | Determine whether public hotel facts can be found and parsed reliably. | Valid JSON-LD/schema, public contact/identity facts, booking-link health, amenity/policy/room fact coverage, canonical-fact comparison. |
| Serve the Human | Determine whether the live AiFrogi bot can answer approved customer questions safely. | Current Golden Bank, pass rate, knowledge freshness, grounded-answer evidence, unresolved/recovery and handover signals. |

The three remaining public pillars are displayed as **Not assessed in v1**, never silently scored:

| Pillar | v1 position |
|---|---|
| Open Protocols | Observe-only; Agent Gateway status may be shown but no fix or readiness claim is sold. |
| Own Identity | Future cross-listing product; needs permitted sources or client-provided data. |
| Manage Trust | AiFrogi can evidence approved knowledge and answer provenance. Public-review authenticity detection is future monitoring, not a current claim. |

**Control & Evidence** is an internal operating pillar applied to every result: AiFrogi must prove the scan version, evidence, reviewer, approval, implementation, and verification state behind every score change.

## 3. Non-goals

Internal v1 must not include:

- Prospect/public scans, public share links, badges, certificates, or external lead generation.
- External-LLM surfacing tests or any claim about what ChatGPT, Gemini, Google, or Perplexity will recommend.
- Automatic publication of content, schema, prices, policies, or website changes.
- Booking, payment, quotation, PMS writes, or Agent Gateway write authority.
- Unpermitted crawling of OTA, Google Business Profile, logged-in, private, or rate-limited sources.

## 4. Product journey

```text
Select hotel → Scan → Evidence-led issue register → Client review
→ Approved work item → Fix / handoff → Re-scan (same rubric) → Verified improvement
```

Issue state is strict:

```text
DETECTED → REVIEW_REQUIRED → APPROVED → IN_PROGRESS → IMPLEMENTED → VERIFIED
                                    ↘ DECLINED / NOT_APPLICABLE
```

Only `VERIFIED` may improve a pillar score. Delivering a handoff pack, suggesting a fix, or accepting payment is never proof of a fix.

## 5. Canonical fact model

Each tenant must maintain an approved fact register before a Readable Data score is interpreted. It contains:

- Legal and customer-facing hotel name; aliases; website and canonical booking URL.
- Address, city, map/contact phone, public email and business hours.
- Properties/stays, room types, occupancy, amenities, policies, check-in/out and cancellation rules.
- Approved photo and logo URLs.
- Rate treatment: whether a rate is static, indicative, or live PMS-only.

Every crawl observation is compared with this register. Crawl text is evidence, not authority. A missing canonical fact produces **insufficient evidence**, not an automatic failure.

## 6. Scoring contract

Every scan run stores `rubricVersion`, checks, raw evidence, timestamps and calculation output. A before/after comparison is valid only when rubric versions match.

Each check defines:

1. Pillar and stable check key.
2. Weight and pass threshold.
3. Required evidence type and freshness period.
4. States: `PASS`, `FAIL`, `INSUFFICIENT_EVIDENCE`, `NOT_APPLICABLE`.
5. Plain-language issue text and approved remediation type.

Composite scores are optional in v1. The UI leads with assessed-pillar status, evidence confidence, and priority issues. Unknown is displayed as unknown, never converted into a poor score.

## 7. Architecture

### 7.1 Readiness domain

Create a tenant-owned Readiness domain protected by the existing RLS model:

- `ReadinessScan`: tenant, property, rubric version, status, source URL, started/finished times, requested-by identity.
- `ReadinessEvidence`: scan, check key, observed value, canonical comparison, source URL, captured time, evidence hash.
- `ReadinessIssue`: pillar, severity, evidence references, proposed remedy, lifecycle state, reviewer and timestamps.
- `ReadinessWorkItem`: approved issue, delivery route, owner, SLA, acceptance criterion and completion record.
- `ReadinessVerification`: re-scan result, verifier, evidence references and before/after linkage.

All scan execution runs as queued jobs with idempotency keys, bounded retries, cancellation, per-domain concurrency/rate limits, timeout and observable job state. A scan is never a single long browser request.

### 7.2 Deterministic scan checks

Initial checks only:

- Fetch permitted public pages under a per-domain request and time budget.
- Respect robots instructions and deny credential/private URLs.
- Detect JSON-LD/schema syntax and relevant Hotel/LodgingBusiness fields.
- Extract public canonical URL, title, meta description, phone, address, image, booking URL, amenities and policy references.
- Test booking links with safe `HEAD`/bounded `GET` checks; never submit a booking.
- Compare observations to approved canonical facts.
- Read Golden Bank/certification and approved-answer evidence for Serve the Human.

### 7.3 Fix execution routes

Each work item declares one route:

- `AIFROGI_MANAGED`: AiFrogi has separately authorised CMS access.
- `AGENCY_HANDOFF`: generate an evidence and implementation pack for the client agency.
- `CLIENT_GUIDANCE`: client receives a checklist and marks work ready for verification.

No route publishes changes without a recorded client approval.

## 8. Dashboard

Tenant dashboard shows:

- Last scan, rubric version, source/freshness date and assessed scope.
- Readable Data and Serve the Human status, confidence, issue count and evidence.
- Unassessed pillars distinctly, not as zeros.
- One clear next action per issue.
- Before/after visual only for comparable scan versions.
- Work-item owner, delivery route, due date, acceptance criterion and verification result.

Super Admin sees cross-tenant operations, queue health, delayed work items and quality metrics; tenants never see another tenant’s data.

## 9. Security, privacy and governance

- Existing RLS controls every readiness record by organization/property.
- Crawl only public, permitted sources; store only necessary HTML extracts/evidence.
- Redact credentials, payment data, forms and personal data before persistence.
- Audit scan request, fact approval, issue decision, work-item status, score calculation and verification.
- Enforce retention for raw extracts; preserve minimal immutable evidence required for verified fixes.
- No client or Super Admin can overwrite scan evidence without an audit record.
- Run tenant certification/regression gates after material knowledge changes before representing Serve the Human as current.

## 10. Acceptance criteria for Internal v1

Internal v1 is complete only when a live hotel tenant can:

1. Run or schedule an internal scan safely.
2. See evidence-backed Readable Data and Serve the Human findings.
3. See `INSUFFICIENT_EVIDENCE` separately from failure.
4. Approve or decline a proposed fix with an audit record.
5. Assign the fix to AiFrogi, an agency handoff, or client guidance.
6. Re-scan and obtain a verified result using the same rubric version.
7. View a truthful before/after change only where comparison is valid.
8. Confirm all readiness data remains tenant-isolated under RLS.

## 11. Delivery phases

| Phase | Deliverable | Exit criterion |
|---|---|---|
| R1 | Readiness data model, RLS, rubric v1 and scan queue | Isolation and idempotency tests pass. |
| R2 | Canonical fact register and deterministic Readable Data checks | Findings include real source evidence. |
| R3 | Serve the Human evidence adapter and internal dashboard | Golden/evidence signals are current and explainable. |
| R4 | Review, work-item and verification workflow | A tenant completes an evidence-backed fix cycle. |
| R5 | Pilot measurement | 5–10 hotels demonstrate useful, fair and repeatable results. |

Only after R5 may AiFrogi approve an external scan, public report, paid external-model observation, certification, badge or ChatGPT/MCP distribution plan.

## 12. Decision log

- AiFrogi AI Readiness is a separate commercial product line within AiFrogi.
- Internal hotel tenants are the first audience.
- Deterministic evidence is the v1 score source of truth.
- Agent Gateway is a supporting readiness signal, not a transaction channel in this product.
- No score increase without a verified re-scan.
- No certificate before real-pilot calibration and approval.
