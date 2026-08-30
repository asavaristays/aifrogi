# AiFrogi Sovereign Intelligence Grade Report

Date: 2026-08-30  
Release inspected: `8830a71`  
Bot / Category: AiFrogi common runtime and current Webtechnosys production pilot  
Certification tier attempted: Trial-Grade  
Rubric: AiFrogi Sovereign Intelligence Completion Checklist & Grading Rubric v1.0

## Result

| Section | Weighted score | Result | Evidence-based reason |
|---|---:|---|---|
| 1. Loop Circuit Breaker | 64.3% | FAIL | Turn state, two-cycle cap, exact normalized repeat detection and governed exit exist. Explicit slot-aware re-ask prevention and semantic-near-duplicate detection are not proven. Because C1-01 through C1-05 are collectively blocking, this section is F. |
| 2. Sovereign Intelligence Suite | 53.3% | FAIL | The automated Common Suite currently contains 24 named cases and passes all of them with zero-tolerance gates at 100%. It is not the complete approximately 30-case suite, and category suites are not executed per bot category. |
| 3. KB Pipeline | 38.5% | FAIL | Atomic-claim validation and conflict blocking exist. Uploaded documents are correctly excluded from wholesale retrieval, but automatic document-to-atomic-claim parsing, production version samples and expiry notification evidence do not exist. |
| 4. Client Acknowledgment | 42.9% | FAIL | Field and preview approval data, UI and publish enforcement exist. Production has no atomic claims or completed preview cycle, and scheduled reconfirmation nudges do not exist. C4-05 therefore lacks evidence and is treated as a blocker. |
| 5. Safety Nets | 16.7% | FAIL | Coverage gating exists. Flag API, claim pause logic and Client Admin queue exist in code, but there is no customer-facing widget control or completed live flag-to-pause-to-correct test. C5-03 is therefore unproven and blocking. |
| 6. Metrics & Reporting | 50.0% | FAIL | Client-visible coverage/freshness/conflict indicators exist and production has zero published unresolved conflicts. Layer-2 sampling, accuracy calculation and 24-hour SLA performance reporting are not implemented. |

BLOCKERS TRIGGERED:

- C1 section blocker: C1-03 slot-aware re-ask prevention not proven.
- C1 section blocker: C1-04 semantic-near-duplicate detection not implemented; only normalized exact fingerprints exist.
- C4-05: no live claims exist from which to prove 100% sign-off completion.
- C5-03: claim auto-pause exists in code, but no completed end-to-end live test proves the next answer stops citing it.

OVERALL WEIGHTED SCORE: 44.7%  
OVERALL GRADE: F  
CERTIFICATION AWARDED: None  
REASON: Release controls exist, but blocker-grade end-to-end evidence and several required operational mechanisms are incomplete. The current Webtechnosys pilot may continue as an explicitly legacy-controlled pilot; new KB-Gated bots must not be certified or activated until the evidence pack passes.

## Evidence reviewed

### Automated evidence

- `npm run test:channels`: 42/42 passed.
- `npm run verify:sovereign`: 14/14 passed, including four KB framework unit checks.
- `npm run typecheck`: passed.
- `npm run build`: passed locally and on production.
- `npm run verify:client-secrets`: eight secret markers absent from browser bundles.
- Current common evaluation: 24 cases, 24 passed; tenant isolation, prohibited claims, false action completion and secret protection gates report 100% within that limited pack.

Passing every existing test does not prove the missing rubric items; the suite itself is incomplete relative to the rubric.

### Production evidence

Aggregate-only production audit after migration:

```text
claims|0
published|0
published_unsigned|0
published_conflicts|0
pending_previews|0
open_flags|0
evidence|2
circuit_breakers|0
```

Additional production checks:

- health status: `ok`
- release: `8830a71`
- database: `ok`
- new flag endpoint rejects an unauthenticated request with HTTP 401
- registration responds HTTP 200
- protected Knowledge route redirects unauthenticated access
- three inspected KB migration columns are present

Zero bad production rows is not equivalent to a successful workflow when the production sample size is zero.

## Item-level status

### Section 1

- PASS: C1-01, C1-02, C1-05, C1-06.
- FAIL: C1-03, C1-04.

### Section 2

- PASS: C2-02, C2-03, C2-06 for the current limited pack.
- FAIL: C2-01, C2-04, C2-05.

### Section 3

- PASS: C3-03, C3-04 at code/unit-test level.
- FAIL: C3-01, C3-02, C3-05, C3-06 due to missing required samples or mechanism.

### Section 4

- PASS: C4-02 at implemented-screen level; C4-03 at code/test level.
- FAIL: C4-01, C4-04, C4-05 due to missing completed production evidence.

### Section 5

- PASS: C5-05 at enforcement and dashboard-code level.
- FAIL: C5-01, C5-02, C5-03, C5-04 due to missing client visibility or end-to-end/SLA evidence.

### Section 6

- PASS: C6-03 from production aggregate query; C6-04 at client-screen level.
- FAIL: C6-01, C6-02 because no defined sampling run or populated live-claim freshness result exists.

## Mandatory closure order

1. Complete Rule 11 semantic duplicate and slot-memory behaviors with A4 transcripts.
2. Expand and version the Common Suite to the full required cases; add executable category suites.
3. Implement document-to-claim review staging and expiry/reconfirmation notifications.
4. Seed one internal non-client certification workspace and complete field approval, preview, publish and supersession cycles.
5. Add the visible answer-flag control and execute flag → immediate claim pause → fallback → correction → reconfirmation.
6. Add Layer-2 sampling, SLA reporting and a permanent machine-readable grading artifact.
7. Re-run this exact rubric. No certification label is permitted until all blockers pass with saved evidence.
