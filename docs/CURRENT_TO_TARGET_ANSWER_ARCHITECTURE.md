# Current-to-target answer architecture

Implementation status (2026-09-30): the common release-scoped retrieval and sealed-claim serving path is implemented in application code. Website crawl remains a compatibility bridge for tenants without an active multi-source release. Disposable PostgreSQL and HTTP fixtures for the new query remain a release gate and are not represented as completed here.

## Release objective

Every configured bot must achieve at least 8/10 correct grounded answers, zero unsafe answers, and correct selective routing. HTTP success is not an answer-quality pass.

## Current runtime map

`question → deterministic intent → active website exact + expanded retrieval → model → material-claim validation → exact final-byte validation → canonical delivery or governed gap/handover`

The production website path is now safe and source-bound, but it is website-specific. PDF and spreadsheet artifacts have immutable ingestion manifests and the database has multi-source release membership, yet those sources do not currently participate in the public answer retrieval path.

## Target runtime map

`question → requested answer parts → parallel release-scoped adapters → source-neutral evidence units → authority-aware fusion → part-by-part composition → final-byte evidence binding → delivery → quality telemetry`

## Source contract

All adapters output `GovernedEvidenceUnit` from `lib/source-neutral-answer-framework.ts`. Every unit carries tenant, property, release, authorization, source version, digest, authority, freshness and a typed locator:

- website: URL, page and chunk;
- PDF: file, page and block;
- spreadsheet: file, sheet, physical row and stable key;
- form/profile: form and field;
- connector: connector, record type and record ID.

Evidence from different tenants, inactive releases, expired authority or incomplete provenance is rejected before fusion.

## Answer and routing rules

1. Decompose compound questions into requested parts.
2. Retrieve per source adapter in parallel from the active sealed release only.
3. Merge exact and expanded retrieval results; rank by signed authority, relevance and freshness.
4. Compose each material statement from named evidence units.
5. If some parts are supported, answer those parts and identify only the missing parts.
6. Do not create human handover for every ordinary first knowledge gap.
7. Handover is required for an explicit human request, sensitive issue, material action needing authority, required missing part, or repeated unresolved question.
8. Validate the exact final response bytes and ordered evidence IDs before delivery.
9. Record source-type coverage, unsupported parts, routing outcome, latency and answer-quality result.

## Implementation sequence

1. **Completed:** source-neutral evidence model, eligibility/fusion contract, partial-answer decision and 8/10 gate.
2. Add release-scoped website adapter using the active crawl generation.
3. Add PDF adapter using page/block manifests.
4. Add spreadsheet adapter using sheet/row/stable-key manifests.
5. Add approved form/profile adapter.
6. Replace the website-only answer context with parallel adapter fusion.
7. Bind final answers to ordered evidence-unit IDs in the canonical delivery record.
8. Generate evaluation questions from each published source and require source-specific plus combined-source 8/10 gates.

## Production acceptance

- ≥80% correct and grounded across at least ten representative questions;
- zero unsafe or cross-tenant answers;
- zero use of revoked, expired or non-active source versions;
- 100% correct routing for explicit human, sensitive and action-required requests;
- ordinary optional gaps do not automatically create support work;
- PDF, spreadsheet, form and website each pass independently, followed by a combined-source pass.
