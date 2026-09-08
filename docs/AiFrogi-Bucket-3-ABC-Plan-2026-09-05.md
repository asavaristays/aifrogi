# Bucket 3 — A/B/C implementation plan

**Current status (6 September): A/B/C complete for defined synthetic/pilot scope.** Final evidence: `AiFrogi-Bucket-3-Final-Acceptance-2026-09-06.md`. Production remains verified `bucket3-b2-20260906`. Historical checkpoint text below is superseded. Next: Bucket 4 real connector certification; Bucket 5 reviewed accuracy evidence.

Scope: BusinessGPT, HotelGPT, ClinicGPT, DineGPT, PropertyGPT, eduGPT, FlowCart and Custom. Shared Sovereign Intelligence remains authoritative. No WhatsApp, real connector certification, tenant reset or live demo seeding.

## Review findings

- Eight versioned persona packs and eight synthetic fixtures already exist. Reuse them rather than inventing another configuration system.
- Current persona tests establish structural contracts and selected boundaries; they do not certify full conversations for all eight categories.
- The isolated HTTP harness is primarily BusinessGPT-oriented. Parameterising it is the main Part B task.
- Boundary matching currently uses English lexical rules; paraphrases/order changes need adversarial evaluation. Do not claim multilingual or 95% accuracy from those rules.
- Custom is a scaffold, not an automatically certified arbitrary workflow.
- The saved execution agreement still described Bucket 2 as open. Update that pointer to the final controlled-pilot acceptance report.

## A — Foundation and fixed acceptance bank

Deliverable: one test-only bank of **80 required journeys (10 × 8 personas)**, stable IDs, inputs, expected outcomes and evidence fields. Reuse existing synthetic facts and mock actions. Check persona/fixture coverage and guard against missing categories.

Implemented files: `tests/sovereign-intelligence/fixtures/bucket-three-cases.ts` and `bucket-three-foundation.test.ts`.

Gate: foundation tests and existing core pass. These tests validate the bank and contracts, **not execution of its 80 journeys**. No runtime release required for test-only additions.

## B — Execute and repair runtime journeys

Parameterise the actual HTTP-handler harness, keeping tenant/profile/model/connector adapters isolated. Execute all ten journeys per persona: approved answer, paraphrase, affirmative continuation, off-topic return, missing slot, multi-turn loop exit, human request, connector failure, authority boundary and tenant isolation.

Use two batches: B1 Business/Hotel/Clinic/Dine; B2 Education/Property/FlowCart/Custom. Each batch records first-run failures, fixes with universal/category scope, rerun evidence and unchanged-suite completeness. Deployment only after runtime changes pass regressions; no live dummy tenants.

Boundary cases need explicit fixture setup: published/foreign claims, previous supported offer, mock connector outage and known/missing slots. Never accept a generic refusal as a passing normal-answer case. Evidence must match served behaviour.

Gate: 80/80 specified journeys executed, no missing/skipped cases, zero unresolved critical failures. Keep correctness and safe refusal separate; synthetic pass rate is not customer accuracy.

## C — Release and handoff

Run the full core and prior Bucket 1/2 gates. Build on VPS staging, retain rollback, deploy the tested runtime and smoke the live reference bot without modifying its facts. Review the 80-case evidence matrix and per-persona results. Record exact release, tests, unresolved limitations and rollback.

Only then close Bucket 3 for its stated synthetic/pilot scope. Real Calendar/Sheets/PMS/commerce certification belongs to Bucket 4; reviewed client data and measured accuracy belong to Bucket 5.

## Token-saving execution rules

- Resume from this file and the case bank; do not reread the whole conversation.
- Keep one shared harness and table-driven inputs, not eight copied test implementations.
- Run focused failing cases while editing, then one full regression per completed batch.
- Report only changes, failures, proof and next action. Do not repeat completed pricing, UI or architecture work.
- Current status: **A implemented and verified locally**. Nine foundation tests added; full core **261/261**, TypeScript passed. B and C not executed. No 80/80 runtime claim or deployment claim. Production remains `bucket2-handover-final-20260905` because this part changes tests/docs only.
# Update — 6 September 2026

B1 implemented: first four personas pass 40/40 isolated runtime journeys; local core 301/301, TypeScript pass. Shared topic-return defect corrected. See `AiFrogi-Bucket-3-B1-Acceptance-2026-09-06.md`. B2's remaining 40 journeys and final Part C acceptance remain open; historical Part A-only status below is superseded by this checkpoint.
# Latest update — B2, 6 September 2026

B2 implemented: eduGPT/PropertyGPT/FlowCart/Custom40/40; combined80/80 on local and VPS staged handler tests; core341/341 and TypeScript pass. Shared topic recovery corrected. See `AiFrogi-Bucket-3-B2-Acceptance-2026-09-06.md`. Part C remains open. Older checkpoints below are historical.
