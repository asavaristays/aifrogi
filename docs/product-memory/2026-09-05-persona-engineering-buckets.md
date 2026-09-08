# AiFrogi engineering execution agreement

Date: 5 September 2026
Status: User-confirmed working direction

## Current checkpoint — supersedes historical state below

Buckets 1 and 2 are accepted within their documented controlled-pilot scope. Production: `bucket2-handover-final-20260905`; see `../AiFrogi-Bucket-2-Acceptance-2026-09-05.md` for limits.

Bucket 3 Part A is implemented and verified locally: 80 specified journeys across eight personas, nine foundation tests, full core 261/261 and TypeScript passed. These are test-bank/contract checks, not execution of the 80 runtime journeys. Parts B/C remain pending. Resume `../AiFrogi-Bucket-3-ABC-Plan-2026-09-05.md` without repeating earlier work. No runtime deployment for test-only Part A.

## Objective

Latest checkpoint: **5B correction-publication safeguards closed**, release `bucket5b-corrections-20260906`; 420/420 local core, 16/16 rollback-only DB lifecycle and 17/17 live 5A HTTP regression. See `../2026-09-06-bucket-5B-corrections.md` for exact scope and limitations. Next **5C private human pilot**. Do not claim concurrency certification, autonomous correction, full historical replay or real-world accuracy from these checks.

Latest 6 September checkpoint: **5A measurement/reviewer tooling closed and deployed**, release `bucket5a-closed-20260906`. 408/408 core, 17/17 staging and 17/17 live authenticated HTTP acceptance. See `../2026-09-06-bucket-5A-closure-check.md`. Next 5B governed corrections; actual human pilot provenance and reviewed customer outcomes remain 5C, not claimed achieved. Bucket4 connector hardening is separately open. This supersedes older 5A planning checkpoints without retroactively closing other buckets.

Build exceptional, evidence-backed AI Bot engineering, not an average chatbot or an inflated rating. Work carefully, one bucket at a time. WhatsApp API is deferred and excluded from this programme until explicitly resumed.

## Architecture

1. Sovereign Intelligence: shared tenant isolation, approved retrieval, authority limits, loop controls, safe failure, verification and evidence. Applicable to existing and future configured bots.
2. Persona and client intelligence: category journey, vocabulary, required slots, approved client facts, actions and handover. Client settings cannot override shared safety rules; client facts cannot leak into other tenants.

## Ordered buckets

| Bucket | Scope | Closure evidence | Current state |
| --- | --- | --- | --- |
| 1 | Shared runtime: retrieval, exact facts/links, multi-turn continuity, loop exits, decision integrity, blocked knowledge | Common and realistic multi-turn website-runtime tests; failures corrected | Accepted 5 September 2026; see closure report |
| 2 | Human handover: consent, persistence, assignment, notification, response, closure and SLA failure | Traceable end-to-end handover including unavailable staff and mail failure | First batch deployed `bucket2-handover-batch1-20260905`; NOT closed. Remaining: `../AiFrogi-Bucket-2-Progress-2026-09-05.md` |
| 3 | All eight personas: BusinessGPT, ClinicGPT, HotelGPT, DineGPT, eduGPT, PropertyGPT, FlowCart, Custom | Isolated dummy-data normal/adversarial/loop/failure journeys per persona | Planned |
| 4 | Provider connectors: begin Calendar/Sheets, then demand-led PMS/commerce | Authorisation, field mapping, read/write authority, idempotency, read-back, revocation and failure tests | Planned |
| 5 | Controlled commercial evidence | Private human pilot, reviewed customer conversations, first 48-hour and seven-day evidence windows before expansion | Planned |

Existing implementations and earlier tests are inputs, not automatic closure of these buckets. Webtechnosys activation does not certify all personas. Do not create synthetic demo clutter in real client accounts.

## Mandatory cycle for each bucket

1. Inspect the actual implementation and define acceptance cases before changes.
2. Capture exact failure, expected outcome and cause.
3. Fix the scoped defects; state whether each fix is universal, persona-specific or tenant-specific.
4. Run relevant regression and end-to-end checks. Resolve critical failures; never hide them by reducing suite completeness.
5. Deploy verified changes safely with rollback available and post-deployment checks. This is the normal agreed workflow; destructive changes, new access, financial actions and client fact approvals still require appropriate authority.
6. Save a dated closure report with release identifier, evidence, failures, residual limitations and rollback reference. Update date-wise progress without overwriting prior entries.
7. Move to the next bucket only after its predecessor's relevant acceptance gates are satisfied. Any blocked external requirement stays explicit; do not certify on optimism.

Use Not tested / Failed / Fixed locally / Verified live as operational states. Respect the separate evidence levels in `../management-evidence-reporting-rule.md`.

## Measurement

Progress: Bucket 1 accepted and deployed as `bucket1-accepted-20260905`. See `../AiFrogi-Bucket-1-Acceptance-2026-09-05.md`: 215 local core tests (including 21 manifest-gated handler cases), 21/21 VPS fixture cases, 10/10 synthetic production turns. Bucket 2 is next; handover is not yet certified. Earlier batch history remains in `../AiFrogi-Bucket-1-Progress-2026-09-05.md`.

95%+ per-persona answer correctness is a target, not an unsupported commercial claim. Report sample sizes, reviewed labels and synthetic versus real traffic separately. Measure safe resolution, action correctness, loops and unnecessary escalation independently. Safe refusal must not inflate answer correctness. Tenant leakage and fabricated transaction confirmations remain zero-tolerance failures.

Feedback feeds a governed correction loop: observe, classify, propose, authorised review, regression, versioned publication, rollout, monitor and rollback. No silent rewriting of approved facts.

## Scope discipline

Do not reopen pricing, cosmetic redesign or WhatsApp work unless a confirmed in-scope blocker requires it. No timer, background automation or autonomous monitoring was requested by this agreement.
# Current checkpoint — 6 September 2026

Bucket 3 B1: BusinessGPT, HotelGPT, ClinicGPT, DineGPT tested through real handler with deterministic infrastructure: 40/40. Core301/301; shared topic vocabulary fix. Acceptance: `../AiFrogi-Bucket-3-B1-Acceptance-2026-09-06.md`. Next: remaining four personas (B2), then Part C. Do not restart Bucket 2 or count B1 as all80/80 or real-world accuracy. Historical checkpoints below remain historical.
# Latest checkpoint — Bucket 3 B2, 6 September 2026

All eight personas now have executed synthetic journeys: B1 40/40 plus B2 40/40. Core341/341; TypeScript pass; VPS staged matrix80/80. Shared vocabulary correction for programmes/properties/workflows. See `../AiFrogi-Bucket-3-B2-Acceptance-2026-09-06.md` for live deployment status. Next is Part C, not a repeat of B1/B2. No connector certification or95% accuracy claim.
# Definitive checkpoint — Part C complete, 6 September 2026

Bucket3 A/B/C closed for specified synthetic/pilot scope. Final report: `../AiFrogi-Bucket-3-Final-Acceptance-2026-09-06.md`. Closed manifest80/80, core341/341, prior VPS58/58. Live release bucket3-b2-20260906 unchanged. Next Bucket4 real connector certification, then Bucket5 real-client evidence. Do not reopen B1/B2 or imply measured95% accuracy. Historical checkpoints below are superseded.
# Latest checkpoint — Bucket 4 A, 6 September 2026

Deployed bucket4-a-20260906: fail-closed Google availability and RAW Sheets customer text. Tests8/8, core349/349. Continue Part B (durable booking idempotency, provider read-back, OAuth and execution authority); Part C live certification needs dedicated Google account/resource authorization. See `../AiFrogi-Bucket-4-Plan-and-Progress-2026-09-06.md`. Bucket4 NOT complete. Older checkpoints below are historical.
# Latest checkpoint — Bucket4 B1

Release bucket4-b1-20260906 deployed, focused16/16 and core357/357. Creation retry/read-back and callback access safeguards implemented. Remaining: Sheets durable reconciliation, OAuth replay/browser binding, execution authority and stored-event/status reconciliation; live certification needs named workspace/resource permission. Google test email supplied in conversation; do not ask for password. Bucket4 NOT complete. See Bucket4 plan for evidence.
# Latest — AI Bot connector setup deployed

Release bucket4-setup-20260906, core360/360. Webtechnosys preparation confirmed in browser; Google resources not created. Google OAuth application client ID/secret missing in runtime environment (presence-only checked). Need Google Cloud app setup before user consent/live certification. No WhatsApp prerequisite now. PartB remaining engineering and PartC certification stay OPEN; see Bucket4 plan.
