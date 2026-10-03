# RAG consolidation candidate — 3 October 2026

Status: core corrections implemented and locally verified; full proposed architecture is NOT complete and NOT deployed. No production change, new crawl, FAQ, tenant-specific answer, or automatic publication was performed.

## Changes

- Existing shared-answer engine remains the sole factual decision maker for tenants already enrolled in the shared rollout. There is no second engine, duplicate knowledge store, or fall-through to legacy answers on engine failure.
- Shared generated answers receive one batch entailment review, in addition to deterministic numbers/polarity/citation guards. Unsupported sentences are withheld; independently supported requested parts can remain. All-unsupported or unavailable support service fails closed.
- Exact extracted public facts retain the zero-model fast path. Answer length remains a formatting preference.
- Public route preserves verified answer bytes and binds delivery to the shared proof. It no longer applies the competing presentation quality gate, sales qualification append, or prior conversation circuit lock to shared answers. Safety, human ownership, action completion controls, canonical delivery audit, signed release admission, and tenant checks remain.
- One conversation subject resolver replaces the duplicate knowledge-service resolver. Pronoun/platform follow-ups resolve against recent relevant questions; privacy/off-topic/human classifications retain priority. History provides subject context, never factual authority.
- A post-commit canonical receipt failure returns the rotated visitor capability with a 503, withholding the answer and permitting retry. Existing embed client already stores a returned token before handling HTTP status.
- XLSX extraction feeds existing document staging and approval. Formulas are rejected rather than converted into authoritative facts. Existing 8 MB, 100-claim and text limits apply. Upload does not publish or approve knowledge.

## Verification

| Check | Result |
| --- | --- |
| Focused engine, contact, conversation, context and workbook tests | 36/36 passed |
| TypeScript | Passed |
| Production webpack build | Passed |
| Broader sovereign/channel suite on candidate | 367/483 passed; 116 failed |
| Same broader suite on unchanged HEAD baseline | 367/483 passed; same 116 failures |
| Newly failing cases relative to baseline | None |
| Complete approved 15-question candidate gate | Not run for this candidate |
| Online Chrome / production verification | Not run for this candidate |

The broader suite is not green. Baseline failures include HTTP fixture eval/import.meta path errors and a stale source-text assertion. Full case names and comparison are in RAG_CONSOLIDATION_TEST_COMPARISON_2026-10-03.json. A test-only server-only module shim was used for both broader runs; production dependencies were not modified. Local tests use fixtures, not actual client passages or measured OpenAI/network latency. They do not establish production answering accuracy or speed.

Reproduce focused checks:

    node --import tsx --test tests/shared-answer/*.test.ts tests/channels/website-bot-conversation.test.ts tests/sovereign-intelligence/answer-context.test.ts
    npm run typecheck
    npm run build -- --webpack

## Required remaining implementation

1. Replace crawl-only source readiness with a canonical publication/source snapshot. Standalone approved PDF/XLSX claims must be retrieved without an active website generation, with source lineage, effective dates and authority by field. The existing workbook-to-crawl bridge is not this implementation.
2. Extend canonical delivery receipts to bind grounded mixed-source paraphrases. Existing receipts distinguish sealed exact claims from crawl claims; do not relabel document claim IDs as crawl chunks or weaken authority checks.
3. Index approved document claims for semantic retrieval, idempotently by immutable claim version; keep unpublished/private entries ineligible and invalidate on revision/revocation.
4. Integrate authorised typed live reads into the same evidence contract, with source timestamps and read permission checks. Existing PMS/action controllers remain separate; this change does not authorise transactions.
5. Complete per-field source precedence/conflict handling using owner approval and effective version. A newer upload alone must not override current authoritative data.
6. Repair baseline HTTP test harness, then run unchanged approved 15 questions plus follow-ups, source freshness, tenant isolation, intermediate failures and delivery retry. Save actual replies, actual retrieved passages, correctness and per-stage/total latency. Repeat against production only after release gate and deployment.

## Rollback

Production has not changed, so no production rollback is needed. This candidate has no database migration and changes no existing approval records. To undo the candidate after it is committed, revert its commit on the working branch. If eventually deployed, build and retain the previous release and source snapshot before activation, then restore both and restart the existing application service if rollback is needed. Do not run the prior contact-overlay rollback script for a later full architecture deployment without checking the corresponding release snapshot.
