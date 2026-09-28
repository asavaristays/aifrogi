# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Core Intelligence — CI-027 unified bounded execution contract

- Add one enforced terminal outcome per public bot turn and prevent unverified material completion claims.
- Bind every published flow-node type to an explicit endpoint/authority/verification contract and reject unbounded non-negotiation cycles.
- Persist the execution policy, terminal outcome, authority, flow, endpoint and verification state in `SovereignAnswerEvidence` through additive migration `20260928150000_stage_two_execution_contract`.
- Run website ingestion with bounded concurrency, duplicate removal, failure evidence and a visible coverage/readiness report.
- Deploy only after the isolated production stage passes migration preflight, focused Stage 2 tests, TypeScript, full production build, first-ten security and client-secret gates.
