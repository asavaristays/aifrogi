# AiFrogi Tenant Intelligence Ledger

Purpose: the permanent capability and tenant-readiness register for business knowledge that makes each AiFrogi bot useful to its own customers.

This ledger prevents bot-by-bot rework and duplicate fixes. It records the shared Tenant Intelligence factory separately from each tenant's approved knowledge readiness. It does not redefine Core safety, intent, privacy, handover or reliability behavior.

## Boundary

Tenant Intelligence owns the individual client's verified business understanding: identity, services, pricing rules, policies, hours, locations, contact details, subject context, approved website/PDF/Excel/manual knowledge, trained answers and tenant-specific golden questions.

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
| `TI-010` | Repeatable Tenant Intelligence Factory | `PLANNED` | Future tenants | Phase 2 of `AIFROGI_EXECUTION_ROADMAP.md` | Begin only after evidence from two real bots; must eliminate engineering edits to code or production data. |

## Tenant readiness register

| Tenant ID | Bot / vertical | Knowledge status | Human-reviewed evidence | Current state | Next evidence |
| --- | --- | --- | --- | --- | --- |
| `TEN-WEBTECHNOSYS` | Webtechnosys AI Agency / Business AI | Approved tenant facts and trained answers are live | Reference 25-question production set passed 25/25 after human review and targeted corrections | `PILOT_EVIDENCE` | Continue real visitor review; correct feedback and missing answers through Improve My Bot. |
| `TEN-PILOT-02` | Second friendly client / to be selected | Not onboarded | None | `PLANNED` | Complete source intake, client approvals, 10-question smoke set and 25-question human-reviewed golden set. |

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
