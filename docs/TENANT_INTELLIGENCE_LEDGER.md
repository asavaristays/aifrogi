# AiFrogi Tenant Intelligence Ledger

Purpose: the permanent capability and tenant-readiness register for business knowledge that makes each AiFrogi bot useful to its own customers.

This ledger prevents bot-by-bot rework and duplicate fixes. It records the shared Tenant Intelligence factory separately from each tenant's approved knowledge readiness. It does not redefine Core safety, intent, privacy, handover or reliability behavior.

## Boundary

Tenant Intelligence owns the individual client's verified business understanding and configured customer journeys: identity, services, pricing rules, policies, hours, locations, contact details, subject context, approved website/PDF/Excel/manual knowledge, trained answers, per-bot flows and tenant-specific golden questions.

A missing or wrong client fact is fixed only in that tenant's approved knowledge. A subject-wide vocabulary or required-topic defect belongs to the vertical/persona layer. A behavior defect affecting multiple tenants belongs in `CORE_INTELLIGENCE_LEDGER.md` as a separate batch.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `PLANNED` | Approved direction; implementation has not started. |
| `LOCAL` | Implemented and locally verified; listed in `PENDING_VPS_CHANGES.md`. |
| `LIVE` | Deployed and verified in production. |
| `PILOT_EVIDENCE` | Live, but real-client usefulness is still being measured. |
| `NEEDS_CLIENT` | Requires facts or approval from the accountable client. |
| `BLOCKED` | Cannot proceed until the recorded dependency is resolved. |
| `RETIRED` | Replaced or no longer used; retained for audit. |

## Tenant Intelligence factory register

| ID | Capability | Status | Scope | Primary implementation / authority | Verification or limitation |
| --- | --- | --- | --- | --- | --- |
| `TI-001` | Website knowledge ingestion | `LIVE` | Per tenant | website crawler and knowledge services | Crawled content becomes governed tenant material, not automatic truth. |
| `TI-002` | PDF, DOCX, TXT, Markdown, CSV and JSON ingestion | `LIVE` | Per tenant | knowledge document service | Extraction exists; client review is required before publication. |
| `TI-003` | Excel onboarding and knowledge import | `LIVE` | Per tenant | onboarding workbook importer | Structured import is available; correctness depends on supplied facts and approval. |
| `TI-004` | Manual question-and-answer entry | `LIVE` | Per tenant | client Intelligence workspace | Supports direct business corrections without engineering code changes. |
| `TI-005` | Atomic claim approval, versioning and rollback | `LIVE` | Per tenant | governed knowledge repositories | Published answers are versioned; superseded history remains auditable. |
| `TI-006` | Client answer Edit, Pause and Delete lifecycle | `LIVE` | Per tenant | Intelligence Step 2 | Client controls current answers; deletion retires live use while preserving governed history. |
| `TI-007` | Feedback and missing-answer correction queue | `LIVE` | Per tenant | Improve My Bot and `/api/improve/answers` | Inline **Save and approve**, Edit and Delete are deployed; corrections remain tenant-bound. |
| `TI-008` | Required business-fact coverage gate | `PILOT_EVIDENCE` | Per vertical and tenant | onboarding/readiness checks | Essential identity, contact, offering and policy coverage exists; factory-level automation needs evidence from two real bots. |
| `TI-009` | Tenant smoke and golden question sets | `PILOT_EVIDENCE` | Per tenant | pilot scripts and reviewed workbooks | Webtechnosys sets exist. Automated pass is not acceptance without human review. |
| `TI-010` | Repeatable Tenant Intelligence Factory | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/fact-factory.ts`, website knowledge service and client Intelligence workspace | Deployed as `ti010-tenant-fact-factory-20260912`. Classifies pages; extracts typed facts; applies correction → Q&A → Excel/PDF → website authority; exposes conflicts and a vertical-aware punch list. Production-stage regression passed 17/17, the 85-route build passed, readiness is healthy and the Webtechnosys bot route returns 200. Suggestions remain drafts until client approval. Rollback: `/var/backups/aifrogi/ti010-tenant-fact-factory-20260912.Mnnzvy`. Two-tenant human evidence remains pending. |
| `TI-011` | Per-bot Flow Intelligence templates and Main Menu publishing | `PILOT_EVIDENCE` | Per tenant bot | `/flow-intelligence`, tenant settings, website widget Main Menu | Release `ti011-graphical-canvas-20260909` is live with draggable coloured nodes, curved connectors, zoom, sliding panels and collapsible application navigation. Real client flow use remains to be reviewed. |
| `TI-012` | Human-owned conversation recovery | `PILOT_EVIDENCE` | Per tenant bot conversation | website widget and handover runtime | Release `tenant-flow-intelligence-20260909` is live. AI remains paused in a human-owned session; visitor may deliberately start a separate AI conversation. Real interaction evidence remains required. |
| `TI-013` | Tenant showcase carousel | `LIVE` | Every tenant and bot category | Tenant Setup, governed knowledge settings, showcase upload API and website widget | Release `ti013-showcase-carousel-20260913`: Owners/Admins can maintain up to eight ordered image cards using a public HTTPS image or verified JPG/PNG/WebP upload, with title, supporting text and optional action link. Content remains workspace-scoped and inherits the bot theme. Existing single welcome highlights remain backward compatible. Channel regression passed 186/186, TypeScript and the 87-route VPS build passed, PM2 is stable and production readiness returned HTTP 200. Authenticated visual configuration remains for the tenant operator. Rollback: `/var/backups/aifrogi/ti013-showcase-carousel-20260913.tgz`. |
| `TI-016` | Deep-crawl entity intelligence | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/deep-crawl.ts`, website knowledge service | Release `ti006-deep-crawl-final-20260914` follows same-origin inventory omitted from sitemaps, preserves property/product/service sections and images, and retrieves exact source-attributed entity facts. Asavari expanded from 27 to 59 pages; exact access evidence passed live Chrome verification. Connector authority remains mandatory for live actions. |
| `TI-017` | Tenant truth governance review queue | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/truth-governance.ts`, fact factory and Intelligence workspace | Release `ti017-truth-governance-20260914` distinguishes legitimate multi-contact facts from competing corrections and prioritizes conflicts, stale evidence and commercial confirmations with source links and explicit next actions. TypeScript, 205 channel tests and the affected 125-test Sovereign subset passed locally; scoped VPS tests and the 87-route production build passed. Public readiness is healthy with zero unstable PM2 restarts. Authenticated Chrome acceptance showed Asavaristays' live 46-item queue: 1 conflict, 0 stale facts and 45 commercial confirmations. Rollback: `/var/backups/aifrogi/ti017-truth-governance-20260914`. |
| `TI-018` | Tenant entity catalogue and vocabulary | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/deep-crawl.ts`, fact factory and Intelligence workspace | Release `ti018-tenant-entities-20260914` builds source-bound property/product/service entities with aliases, category vocabulary and typo-tolerant matching. Retrieval scores tenant vocabulary; stricter extraction rejects narrative prose masquerading as hours, addresses or prices. Local TypeScript, 207 channel and 361 Sovereign tests passed; VPS focused tests and the 87-route build passed. Authenticated Asavaristays recrawl found 59 pages and 12 properties, reduced the Truth Review Queue from 46 noisy items to 5, and removed false conflicts. Live typo acceptance resolved “Rohet Grah” to Rohet Garh and returned exact evidence: `Airport: Jodhpur 35 Kms`. Rollback: `/var/backups/aifrogi/ti018-tenant-entities-20260914`. |
| `TI-019` | Tenant learning lifecycle | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/learning-lifecycle.ts`, website crawler, automation worker and Intelligence workspace | Release `ti019-learning-lifecycle-20260914` detects added, removed and changed website pages/facts; calculates tenant-specific freshness; refreshes a bounded due batch through the existing automation endpoint; and groups repeated unanswered questions into reviewable draft topics. No detected change or learned topic is published automatically. Local TypeScript, focused 3/3, channel 207/207, Sovereign 365/365 and the 87-route production build passed; VPS TypeScript, focused 3/3 and the 87-route build passed. Readiness is healthy and PM2 has zero unstable restarts. Rollback: `/var/backups/aifrogi/ti019-learning-lifecycle-20260914`. |
| `TI-020` | Tenant launch certification | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/certification.ts`, Setup certification panel and website-bot lifecycle | Release `ti020-tenant-certification-20260914` lets Client Owners/Admins build a five-question smoke or ten-question golden bank with expected grounded-answer or safe-handover outcomes. Runs use the real tenant answer path plus fixed privacy probes; any website recrawl or governed-answer change expires the pass. Both client review submission and Super Admin go-live enforce the current pass server-side alongside existing Core certification. Local TypeScript, focused 7/7, channel 207/207, Sovereign 365/365 and the 88-route build passed; VPS TypeScript, focused 7/7 and the complete 88-route build passed. Readiness is healthy and PM2 has zero unstable restarts. Rollback: `/var/backups/aifrogi/ti020-tenant-certification-20260914`. |
| `TI-021` | Approval-based Golden-bank assistant | `LIVE` | Every current and future tenant | `lib/tenant-intelligence/certification-templates.ts`, certification API and Setup panel | Release `ti021-golden-assistant-20260914` builds a ten-question draft from current approved tenant questions plus category coverage and two safe-handover boundaries. Nothing changes until the Client Owner/Admin explicitly reviews and saves the replacement bank; saving invalidates the previous result and requires rerunning certification. VPS TypeScript, focused 5/5 and the complete 88-route build passed. Authenticated Chrome confirmed draft generation, explicit Save control and cancellation without modifying the existing 10/10 bank. Final Core fleet gate passed 30/30 and 2/2 live tenants. Rollback: `/var/backups/aifrogi/ti021-golden-assistant-20260914`. |

## Tenant readiness register

| Tenant ID | Bot / vertical | Knowledge status | Human-reviewed evidence | Current state | Next evidence |
| --- | --- | --- | --- | --- | --- |
| `TEN-WEBTECHNOSYS` | Webtechnosys AI Agency / Business AI | Approved tenant facts and trained answers are live | Reference 25-question production set passed 25/25 after human review and targeted corrections | `PILOT_EVIDENCE` | Continue real visitor review; correct feedback and missing answers through Improve My Bot. |
| `TEN-ASAVARISTAYS` | Asavaristays / Business AI for hospitality | Five governed trial-essential answers published: services, business identity, contact, booking-enquiry start and human support | Each added answer passed atomic validation, field approval, preview approval and publication regression; client-wide golden-set review is not yet complete | `PILOT_EVIDENCE` · LIVE | Client reviews the four account-derived essentials and completes a 10-question live smoke set followed by a 25-question human-reviewed golden set. |

## Duplicate-prevention gate

Before changing a client's bot answer:

1. Identify the tenant and search this ledger plus that tenant's approved knowledge before writing code.
2. Classify the problem once:
   - wrong or missing business fact → tenant knowledge;
   - repeated subject defect across one vertical → persona/vertical policy;
   - shared behavior across tenants → defer to the Core ledger as a separate batch.
3. Reuse existing ingestion, approval, correction and regression workflows; never hard-code the answer into shared runtime code.
4. Update the relevant `TI-*` or `TEN-*` entry with the knowledge version, reviewed question set and evidence.
5. Never combine Tenant and Core implementation, tests, deployment packages or success claims.
6. Move status only with evidence: imported is not approved, approved is not human-tested, and locally tested is not live.
7. Preserve tenant isolation, audit history and rollback on every correction.

## Tenant checklist disposition — `TI-010`

- Implemented now: page-type classification, typed website extraction, contact normalisation, canonical duplicate handling, explicit source authority, equal-authority conflict flags, timestamps/refresh periods, approval-ready business profile draft, vertical-aware missing-fact punch list, and a clear client review screen.
- Already provided by the governed knowledge foundation: atomic document claims, client approval, correction versions, rollback/supersession, conflict suppression, expiry, required-topic readiness and tenant-bound missing-answer queue.
- Implemented in `TI-019`: scheduled bounded recrawl, crawl-diff review and grouped unanswered-question draft topics. These suggestions remain subject to tenant review and the established approval lifecycle.
- Deliberately not claimed complete: inferred tone approval, structured table extraction from arbitrary PDFs, weekly approval/edit/reject analytics, and evidence from two live tenants. These remain future Tenant work and must not be simulated or mixed into Core Intelligence.

## New factory-capability template

| ID | Capability | Status | Scope | Primary implementation / authority | Verification or limitation |
| --- | --- | --- | --- | --- | --- |
| `TI-NEXT` | Clear tenant-intelligence capability | `PLANNED` | Tenant or vertical | Planned module or workflow | Client approval, golden questions and known limitation |

## New tenant template

| Tenant ID | Bot / vertical | Knowledge status | Human-reviewed evidence | Current state | Next evidence |
| --- | --- | --- | --- | --- | --- |
| `TEN-SLUG` | Client name / bot category | Sources received, draft, approved or live | Sample size and review owner | `NEEDS_CLIENT` | Exact next acceptance action |

## Update responsibility

- Update this file in the same commit as every Tenant Intelligence change or tenant-readiness decision.
- Add the `TI-*` or `TEN-*` ID to the daily log and pending VPS entry.
- A tenant is never called ready from ingestion count or automated PASS alone; human review and client acceptance must be recorded.
- The authoritative delivery order remains `AIFROGI_EXECUTION_ROADMAP.md`.
| `TI-ASAVARI-BOOKING-001` | Asavaristays approved online booking and availability | `LIVE` | `asavaristays-703624` | Featured booking card includes 8 destinations and 12 properties. Authenticated production GET availability passed with database-backed property, room and rate data; dated chat enquiries now return verified yes/no results and clickable property links. Booking/payment writes remain governed by provider confirmation and read-back. |
| `TI-014` | Governed commercial negotiation through Flow Intelligence | `IMPLEMENTED` | Per tenant property or room | Tenant controls enablement, public rate, private floor, adjustment, rounds and approval mode. Runtime requires verified live-rate context, never exposes the floor, and escalates outside authority. First policy: Jawai Dam Stay ₹6,500 public / ₹6,000 private floor. Production deployment and live evidence pending. |
### TI-015 — Tenant-wide verified stay negotiation

- Hotel rate and availability enquiries are routed through the approved booking connector; missing dates are requested instead of inventing availability.
- A named stay is matched to its configured destination so verified results can show its photo, rooms, availability and live starting rate.
- Negotiation remains dormant unless the guest explicitly requests a better rate. Published tenant authority derives private 4%, 7% and 10% progressive limits from the connector-verified rate for any stay.
- Accepted offers open the booking journey for the correct destination. Requests below authority route to reservations management without revealing the private floor.
