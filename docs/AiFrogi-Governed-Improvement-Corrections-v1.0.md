# AiFrogi Governed Improvement Corrections v1.0

Status: Actionable implementation plan  
Created: 31 August 2026  
Authority: Sovereign Intelligence Rule Book and KB Verification Framework

## Purpose

AiFrogi improves through governed evidence, not silent self-training. Customer conversations can expose defects, but cannot directly rewrite approved knowledge, expand bot authority or modify constitutional rules.

`Observed failure → classified issue → proposed correction → authorised review → regression test → approved version → controlled rollout → monitored result → rollback if required`

## Priority and timing

### P0 — complete before the next high-risk client activation

1. **Conflict-family suppression.** When a new claim conflicts with an active claim, suppress the disputed claim family immediately. Preserve every version, block publication and return a verification/handover response until an authorised supersession completes field approval, preview approval and versioned publication.
2. **Unattended flag escalation.** Incorrect-fact flags pause affected claims immediately. Notify responsible operators, escalate unacknowledged flags after two hours, mark unresolved flags overdue after 24 hours and continue daily escalation. Never republish because a timer expires.
3. **Enforced role authority.** Client Owner/Admin may approve business truth and resolve knowledge flags. Agents/Viewers cannot modify governed knowledge. Super Admin owns readiness and platform oversight. Engineering repairs runtime or connector defects but cannot approve a client's business facts. Constitutional changes require separately authorised, versioned engineering work.
4. **State-specific fallback.** Flagged, expired, conflicted, rejected or unavailable knowledge must have explicit retrieval and customer-response behaviour. Disputed knowledge is never replaced with a guess.

### P1 — complete during the first five-client pilot

5. **Implemented:** automatically run the atomic-claim, output-safety and complete Sovereign Common Suite before publishing a corrected claim. Publication is blocked on failure and passing evidence is stored with the release activity.
6. **Implemented:** make trigger-to-lifecycle routing explicit in product documentation and the Knowledge operations UI, including containment state, priority, owner, deadline and safe next action.

### P2 — implement after meaningful real-client evidence exists

7. **Foundation implemented; activation deferred:** negative feedback is normalized, stripped of common contact identifiers, fingerprinted within its tenant and stored as evidence for future clustering. Cross-tenant fingerprints, silent knowledge changes and automatic correction proposals are prohibited. Semantic clustering remains deferred until meaningful real-client evidence exists; suggestions must remain drafts and require the complete approval lifecycle.

## Trigger-to-lifecycle routing

| Trigger | Immediate containment | Enters seven-stage KB lifecycle? |
| --- | --- | --- |
| Negative feedback | Evidence-linked quality signal; no automatic pause | Only after review identifies a knowledge defect |
| Incorrect-fact flag | Pause cited claim and open timed review | Yes |
| Knowledge gap | Count exact recurrence and retain unanswered intent | Yes, when an answer is proposed |
| Expired claim | Remove from retrieval | Reconfirmation if unchanged; full lifecycle if edited |
| Conflicting claim | Suppress disputed claim family | Yes |
| Rule 11 circuit breaker | Exit after two unresolved clarification cycles | Only if analysis requires knowledge/persona/runtime correction |
| Connector failure | Safe read/write fallback and operational incident | Only if approved documented behaviour changes |
| Evidence mismatch | Release/evaluation defect | Engineering workflow, not business-fact approval |

## Role matrix

| Responsibility | Client Owner/Admin | Super Admin | System | Engineering |
| --- | --- | --- | --- | --- |
| Submit and approve business facts | Yes | Assisted oversight | Validate and record | No |
| Approve conversational preview | Yes | Assisted oversight | Enforce order | No |
| Pause a disputed claim | Yes | Yes | Yes | No |
| Resolve incorrect-fact flag | Yes | Assisted oversight | Enforce SLA state | No |
| Make bot live | No | Yes | Enforce readiness | No |
| Diagnose runtime/connector defect | View/report | Coordinate | Detect and contain | Yes |
| Change constitutional rules | No | Authorise | Enforce version | Implement and test |

## Timing and fallback contract

- Claim removal after explicit flag: immediate.
- Claim-family suppression after detected conflict: immediate.
- Expired claim removal: immediate when evaluated.
- Responsible-party notification: immediate best effort with durable operational evidence.
- Unacknowledged escalation: two hours.
- Resolution target: 24 hours.
- Overdue escalation: daily until resolution.
- A paused claim remains paused indefinitely until authorised correction or reconfirmation.
- While unavailable, the bot states that the information is being verified and offers human handover. It does not serve an older disputed value or invent a replacement.

## Clarifications

- Exact knowledge-gap recurrence counting is implemented. Semantic clustering of differently worded feedback into a proposed correction is a later capability.
- Rule 11 defaults to two unresolved clarification cycles. The circuit breaker then forces limitation, refusal, approval request or escalation and remains locked for that intent thread.
- Claim-level containment preserves unaffected bot capabilities while disputed knowledge remains unavailable.
- Feedback fingerprints are tenant-bound analytical metadata, not authority to change an answer. The original evidence remains the audit source.

## Publication regression gate v1.0

Every preview-approval and reconfirmation request now runs three release checks before the transaction may publish:

1. Atomic claim validation for completeness, dates, value type and currency rules.
2. Output claim validation for unsupported numbers, links, live availability and unverified completed actions.
3. The complete 30-case Sovereign Common Suite, including all zero-tolerance gates.

A failed check returns an explicit publication error and leaves the preview pending. A passing check is persisted as `KNOWLEDGE_PUBLICATION_GATE_PASSED` operational evidence with suite version, score, zero-tolerance status and affected scope.

## Acceptance evidence for P0

- Creating a conflicting claim immediately removes every active version of its claim family from retrieval.
- A relevant visitor question receives the conflict/verification fallback, even when a cached website source contains related text.
- A flag immediately pauses cited claims and creates notification evidence with two-hour and 24-hour deadlines.
- Scheduled processing distinguishes `OPEN`, unacknowledged overdue and resolution overdue flags without auto-republishing claims.
- Agent and Viewer requests to approve, publish, reconfirm, pause or resolve governed knowledge return 403.
- Tests cover conflict, flag, expiry, missing knowledge, connector-safe fallback and role boundaries.
