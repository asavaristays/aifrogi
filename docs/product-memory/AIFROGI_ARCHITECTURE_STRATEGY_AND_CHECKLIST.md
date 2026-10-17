# AI-Frogi architecture strategy and execution checklist

Updated 17 October 2026. Planning baseline; not an implementation-completion claim. Read AIFROGI_TARGET_AND_INSTRUCTIONS.md and AIFROGI_DISCUSSION_LEDGER.md first. Current status and closure evidence live in AIFROGI_ARCHITECTURE_WORK_REGISTER.md / aifrogi-architecture-work-register.json.

## Strategy

Complete the already-approved shared architecture by closing its contract gaps. Preserve the canonical source/publication/delivery and tenant boundaries that have evidence. Avoid a new parallel engine, client-specific branches, source/answer editing to satisfy tests, and repeated prompt changes without a diagnosed contract failure.

The executing unit is an architecture capability with a reproducible defect, a general correction and an invariant test. Its outcome must apply across unseen clients and question formulations. A natural-language answer can be incomplete, unsupported or unavailable for different reasons; the pipeline must represent those states accurately.

## Ordered work

| Phase | Register items | Deliverable | Exit condition |
| --- | --- | --- | --- |
|0 Context and truthful baseline | W00,W01,A24 | Mandatory reading gate, instruction/discussion ledger, strategy, current tabular register | Context coverage is recorded; missing history/conflicts are explicit; one work item selected |
|1 Proof contracts and diagnosability | A10,A13 | Valid nested evidence references; sanitized typed failures and a trustworthy test transport | Invalid identifiers cannot be generated/accepted; a failure trace identifies its actual layer without leaking secrets |
|2 Question understanding, retrieval and complete grounded answers | A07,A08,A09,A11,A14 | Requested-part plan before retrieval; evidence coverage by part; authority selection; independent support/completeness; bounded recovery | Supported parts survive; missing/conflicting/live parts are explicit; no topic-specific answer repair or extra brain |
|3 End-to-end source and serving lifecycle | A02-A06,A12,A15,A16 | Source lineage, index/recovery states, current publication, same contract across adapters, exact delivery | Publication/correction/revocation and faults pass through the actual pipeline on one pinned candidate |
|4 Independent qualification and first-client operations | A01,A17-A21 | Frozen and held-out architecture evaluation; actual onboarding/privacy/support evidence | Representative varied businesses/sources pass with unchanged common code and no unsafe answers; external evidence is real |
|5 Controlled release | A22 | Committed signed source, exact migration/rollback rehearsal and scoped deployment approval | Only the approved release/customer activates; actual public delivery/support/backup monitoring verified |
|6 Separate fleet qualification | A23 | Multi-tenant capacity/recovery evidence | Explicit fleet criteria met independently; no inferred1,000-bot readiness |

## Work checklist

Before implementation:

- [ ] Pass the mandatory full-Markdown/discussion startup gate.
- [ ] Restate the target, approved scope, preserved holds and selected register ID.
- [ ] Identify an architectural failure with actual source/trace evidence; distinguish confirmed facts from hypotheses.
- [ ] Define what a general fix must guarantee, what is already working, and a bounded verification method.

For each capability:

- [ ] Reproduce the contract defect with synthetic data and frozen expectations.
- [ ] Change the shared contract/component, preserving original business evidence and approvals.
- [ ] Add an invariant test that also rejects unauthorized/unsupported alternatives; do not merely assert the implementation's wording.
- [ ] Verify the complete affected path, including failure/recovery/current authority where relevant.
- [ ] Record result, exact evidence, limitations and next dependency in the register. Do not reopen unrelated work.

Architecture acceptance:

- [ ] Original approved gate and criteria remain unchanged.
- [ ] Held-out businesses and question paraphrases exercise the same code without per-client engineering.
- [ ] Website/PDF/Excel/form each work independently, then in mixed-source use.
- [ ] Compound questions retain every supported requested part; absent/conflicting information is handled correctly.
- [ ] Entity, condition, modality, quantity, authority, effective date, correction, expiry and revocation cases pass.
- [ ] Tenant/history/cache/proof isolation and live/action/human routing pass with zero unsafe confirmations.
- [ ] Model and test-transport failures are separately diagnosed; unavailable answers are not scored as knowledge errors or successful contact recovery.
- [ ] Exact public reply, evidence, routing, source versions, receipt and per-stage timing are retained.
- [ ] First-client operational/data terms and exact release/rollback gates close before production approval is requested.

## Stop rule

Do not rerun a full bank after each prompt/fixture tweak. First isolate the class of failure with the existing trace and a focused contract test. If an essential decision/access/history item is missing, stop and name that item. A new complete acceptance run happens only after the relevant architecture corrections and harness checks are finished. No arbitrary loop count or favourable rerun substitutes for this order.

## First implementation item after this planning request

A10: constrain nested proof references to the request evidence set and prove the contract across tenants/sources. The recorded services case had correct supporting facts, but the verifier omitted a character in a nested opaque evidence ID. Rejecting that malformed proof was correct; permitting unconstrained generation of the reference was the architectural defect. Do not repair IDs fuzzily or alter the business answer.

A13 follows: separate test transport, provider and application/proof errors before interpreting an accuracy score. Then complete A07/A08/A11 using the existing common engine. These are architecture work items, not a list of seven answer corrections.
