# AiFrogi KB Verification Framework v1.0

Status: Locked for implementation  
Layer: Sovereign Intelligence — verified business knowledge  
Target: 94.5% measured Layer-2 verified accuracy  
Effective: 30 August 2026

## Product rule

An AiFrogi bot may be configured and installed before preparation is complete, but it cannot be made live until its product intelligence is ready. Readiness is an enforced system gate, not a checklist on paper.

## Seven-stage knowledge lifecycle

1. Intake — forms, trusted website sources, files or connectors enter a tenant-bound workspace.
2. Structuring — information becomes atomic claims; uploaded documents are source evidence and are not retrieved wholesale.
3. Automated verification — required fields, formats, currency, dates, expiry and truncation are checked.
4. Conflict check — a disagreement blocks publication until the newer claim explicitly supersedes the prior version.
5. Client sign-off — a named person approves the field and then the conversational preview.
6. Versioned publish — only the signed, traceable version can be retrieved by the live bot.
7. Monitoring and refresh — expiry, flags and conflicts pause the affected claim and require review or reconfirmation.

## Mandatory go-live gate

- Category knowledge coverage: at least 80%.
- Freshness: at least 95% of published claims within their validity window.
- Published unresolved conflicts: zero.
- Unsigned published claims: zero.
- Pending conversational previews: zero.
- Open answer flags: zero.
- Website installation detected before Super Admin activation.

The gate applies automatically to newly created bot profiles under `kbGateVersion: 1.0`. Existing production pilots remain compatible until deliberately enrolled, preventing an unsafe surprise shutdown.

## Three acknowledgments

- Field approval records the approver and timestamp for the exact atomic fact.
- Preview approval records acceptance of the actual customer-facing answer.
- Reconfirmation renews a still-correct claim for its defined refresh period.

There is no generic conflict-bypass checkbox. A conflicting claim must explicitly name the version it supersedes; the old version is retained as evidence and removed from retrieval.

## Production correction loop

Each governed answer records the exact claim IDs used. A visitor or Client Admin can flag an answer. The affected claim is immediately paused, the report is due for acknowledgment within two hours and resolution within 24 hours, and the rest of the bot remains available. The operational message is factual: the answer matched an approved version, the underlying fact is now paused for correction.

## Metrics

- Layer-2 verified accuracy target: 94.5%.
- KB coverage at launch: ≥80%.
- Freshness: ≥95%.
- Named sign-off completion: 100%.
- Published unresolved conflict rate: 0%.
- Flag resolution within 24 hours: ≥95%.
- Reconfirmation within seven days: ≥90%.

The previously discussed 95.5% Safe Resolution Rate is a later output-layer maturity target. It is intentionally separate from the 94.5% business-knowledge accuracy target, which also depends on the correctness of client-confirmed facts.

## Responsibility principle

AiFrogi owns retrieval fidelity, safe generation, verification workflow, traceability and timely correction. The business owns the truth of facts it signs off. The interface must present this as shared operational governance—not blame—so a data correction does not become a bot-removal event.
