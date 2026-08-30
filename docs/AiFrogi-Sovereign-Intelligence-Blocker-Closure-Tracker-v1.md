# AiFrogi Sovereign Intelligence Blocker Closure Tracker v1

Status: Active  
Baseline release: `8830a71`  
Baseline report: `AiFrogi-Sovereign-Intelligence-Grading-Report-2026-08-30.md`  
Baseline grade: F, 44.7%, no certification  
Rule: completion requires saved evidence. Code presence alone is not completion.

## Release gates

- No Trial-Grade certification while any rubric BLOCKER is open or unproven.
- No new client bot may be activated outside KB Gate 1.0.
- A passing percentage is not calculated unless the required suite manifest is complete.
- Existing Webtechnosys remains an explicitly legacy-controlled pilot until intentionally enrolled.
- Production evidence must use a designated internal certification workspace before client rollout.

## Wave 1 — Atomic knowledge foundation

Objective: turn approved source material into reviewable atomic claims so preview, sign-off, versioning and metrics can produce real evidence.

Dependencies: none.  
Unblocks: C3-01, C3-02, C3-05, C4-01, C4-02, C4-03, C4-05, C6-01, C6-02.

| Tracker | Rubric IDs | Work item | Status | Required evidence |
|---|---|---|---|---|
| W1-01 | C3-01 | Parse uploaded PDF, DOCX, CSV, JSON, Markdown and text sources into staging claims rather than publishing raw blobs. | Implemented; production evidence pending | One controlled upload producing at least five separately reviewable claims linked to the source document. |
| W1-02 | C3-02 | Populate claim key/type, value type, domain, source, currency where applicable, effective/expiry dates, cadence, reliability and authority. | Implemented for deterministic fields; evidence pending | Export of five staged claims with every mandatory field populated or an explicit validation reason. |
| W1-03 | C3-03 | Reject malformed, incomplete and unsafe parsed claims before field approval. | Partially proven | Automated negative fixtures plus UI/API evidence showing rejection reasons. |
| W1-04 | C3-04 | Block contradictory active claims unless the new version explicitly supersedes the prior version. | Code/unit proven; E2E pending | Conflict fixture, rejected publish attempt, supersession selection and retained prior version. |
| W1-05 | C3-05 | Preserve immutable version history through supersession. | Code present; evidence pending | Version 1 and version 2 visible with approvers, timestamps and supersession relationship. |
| W1-06 | C4-01/C4-02 | Complete named field approval and conversational preview approval in the certification workspace. | Pending | Ten published claims with named field sign-off; preview transcript and approval record for each. |
| W1-07 | C4-03/C4-05 | Prove preview cannot be bypassed and published unsigned count remains zero. | Unit proven; E2E pending | Failed direct-publish attempt and production audit query showing zero unsigned live claims with a non-zero published sample. |

Wave 1 exit gate:

- At least ten atomic claims published in the internal certification workspace.
- At least five claims originate from one uploaded source.
- No whole-document text is available to governed retrieval.
- Every published claim has field and preview approval evidence.

## Wave 2 — Rule 11 blocker closure

Objective: prove the bot cannot loop through paraphrased repeats or re-request information it already possesses.

Dependencies: none. May run alongside Wave 1.  
Unblocks: C1-03, C1-04 and the Section 1 collective blocker.

| Tracker | Rubric IDs | Work item | Status | Required evidence |
|---|---|---|---|---|
| W2-01 | C1-03 | Define required slots by intent/category and persist each explicit or consented slot with provenance. | Generic date/topic/name/contact memory implemented; category-required-slot map pending | State record showing required, collected and missing slots for appointment, hospitality and general-business examples. |
| W2-02 | C1-03 | Prevent clarification generation for a slot already present in governed state. | Implemented for name/date/topic/contact; expanded transcripts pending | SIC-A4-02 transcript where name/date/topic/contact are not asked twice across paraphrased turns. |
| W2-03 | C1-04 | Add bounded semantic similarity for customer questions and assistant answers, retaining exact fingerprints as the fast path. | Implemented with deterministic thresholds; production evidence pending | Configured threshold, deterministic fixtures above/below threshold and stored breaker reason. |
| W2-04 | C1-01/C1-02/C1-05/C1-06 | Preserve current counter, two-cycle cap, verbatim detection and gap-disclosure exit. | Proven by current tests | Regression run showing all A4 cases pass after W2-01 through W2-03. |

Wave 2 exit gate:

- SIC-A4-01 through SIC-A4-04 pass as distinct behaviors, not aliases of one repeated-question fixture.
- Transcript shows a paraphrased duplicate triggers bounded exit.
- Transcript shows a previously supplied slot is retained and not requested again.

## Wave 3 — Visible flag-to-pause correction loop

Objective: make answer correction usable and prove a flagged claim immediately leaves retrieval.

Dependencies: Wave 1 must provide at least one published claim for full E2E evidence. UI/API work may begin earlier.  
Unblocks: C5-02, C5-03 and operational data for C5-04.

| Tracker | Rubric IDs | Work item | Status | Required evidence |
|---|---|---|---|---|
| W3-01 | C5-02 | Add a small accessible “Flag this answer” action to governed widget answers and the Client Admin conversation review. | API/queue present; controls pending | Screenshot and signed request tied to the active visitor/session/evidence record. |
| W3-02 | C5-03 | Execute flag → affected claim PAUSED → next retrieval excludes it → safe gap disclosure. | Code present; E2E pending | Before/after transcript, claim status record and evidence IDs proving no post-flag citation. |
| W3-03 | C5-02/C5-04 | Route the flag into the correction queue with two-hour acknowledgment and 24-hour resolution deadlines. | Data fields/UI list present | Queue screenshot, acknowledgment timestamps and resolution record. |
| W3-04 | C5-03 | Correct, preview, republish/reconfirm and verify the repaired answer. | Pending | Complete correction lifecycle with new claim version and successful retest. |

Wave 3 exit gate:

- The widget action is visible and keyboard accessible.
- Cross-tenant and forged-evidence flag attempts are rejected.
- A flagged fact cannot be cited on the immediately following request.
- The remainder of the bot remains operational.

## Wave 4 — Evaluation completeness

Objective: make test-suite completeness a prerequisite to scoring and execute category-specific packs.

Dependencies: may run alongside Waves 1–3.  
Unblocks: C2-01, C2-04, C2-05 and trustworthy C2-06.

| Tracker | Rubric IDs | Work item | Status | Required evidence |
|---|---|---|---|---|
| W4-01 | C2-01 | Create a versioned Common Suite manifest with required IDs and expected case count. | Implemented as Common Suite 1.2 with 30 required IDs | Machine-readable manifest and immutable suite version. |
| W4-02 | C2-01/C2-06 | Withhold SRR and release status if required IDs are missing, duplicated or unexpectedly added. | Implemented; release evidence pending | Test showing 29 passing cases against a 30-case manifest reports `WITHHELD`, not 100%. |
| W4-03 | C2-02/C2-03 | Preserve tenant isolation and grounding at 100% with route/data-level cases, not only pure functions. | Pure tests pass; integration expansion pending | Cross-workspace fixtures and approved/unapproved retrieval attempts. |
| W4-04 | C2-04 | Add executable category suites for BusinessGPT, HotelGPT, ClinicGPT, DineGPT, PropertyGPT, eduGPT, FlowCart and Custom. | Pending | Per-category logs with required IDs and case counts. |
| W4-05 | C2-05 | Require every fixed production failure to add a permanent named regression case linked to evidence. | Pending | Failure-to-test mapping in grading artifact and CI rejection when mapping is absent. |
| W4-06 | C2-06 | Compute SRR only after completeness and zero-tolerance gates pass. | Current calculation exists without completeness gate | Raw result artifact independently recomputable from case outcomes. |

Suite completeness algorithm:

```text
if actual_case_ids != required_manifest_case_ids:
    status = INCOMPLETE
    score = WITHHELD
    certification = BLOCKED
else:
    calculate SRR
    require every zero-tolerance gate = 100%
    require SRR >= certification threshold
```

Wave 4 exit gate:

- Missing, duplicate and unknown case fixtures all block scoring.
- Common and selected category manifests are complete.
- Raw per-case evidence and independently recomputed score match.

## Wave 5 — Freshness and measured operations

Objective: use real atomic-claim and correction data to manage freshness, accuracy and SLA performance.

Dependencies: Wave 1 produces claims; Wave 3 produces flag lifecycle data.  
Unblocks: C3-06, C4-04, C5-04, C6-01, C6-02 and mature C6-04.

| Tracker | Rubric IDs | Work item | Status | Required evidence |
|---|---|---|---|---|
| W5-01 | C3-06/C4-04 | Schedule approaching-expiry and expired-claim notifications with idempotent delivery tracking. | Pending | Trigger configuration, deduplication key, notification log and one full reconfirmation cycle. |
| W5-02 | C6-02 | Report fresh, approaching-expiry, expired and paused claims per tenant and category. | Basic freshness percentage exists | Populated dashboard and independently matching database query. |
| W5-03 | C6-01 | Define sampling cadence and calculate Layer-2 Verified Accuracy from tested live answers against current business reality. | Pending | Versioned methodology, non-zero sample and recomputable result. |
| W5-04 | C5-04 | Calculate acknowledgment and 24-hour resolution SLA performance from flag timestamps. | Pending | Non-zero sample report and independently matching query. |
| W5-05 | C6-03/C6-04 | Keep published unresolved conflicts at zero and expose the confidence dashboard to Client Admin and Super Admin. | Conflict gate/client summary exist | Non-zero published sample, zero-conflict query and both role screenshots. |

Wave 5 exit gate:

- At least one full expiry/reconfirmation cycle is recorded.
- Layer-2 Accuracy uses a defined non-zero sample.
- Flag SLA report uses a defined non-zero sample.
- Dashboard results match independent aggregate queries.

## Next grading run

The next report must compare against the baseline item-by-item:

```text
Rubric ID | Baseline status | Current status | Evidence URI/path | Regression test ID | Reviewer
```

Expected milestone after Waves 1–3: all active blockers closed and a likely C/D numeric grade. This is a valid engineering milestone, but it is not certification. Trial-Grade is awarded only when the unchanged rubric, complete suite, threshold and all zero-tolerance conditions pass together.
