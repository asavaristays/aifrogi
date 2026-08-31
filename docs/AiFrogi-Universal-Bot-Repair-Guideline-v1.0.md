# AiFrogi Universal Bot Repair Guideline v1.0

Status: Operational and implemented  
Effective: 31 August 2026  
Applies to: BusinessGPT, HotelGPT, ClinicGPT, DineGPT, PropertyGPT, eduGPT, FlowCart and Custom Bot

## Governing principle

Repair the layer that failed. Never use a client knowledge edit to conceal a runtime defect, and never use a universal code change to copy one client's business truth into another tenant.

`Evidence → classify → contain → correct → approve → regress → publish/certify → retest → resolve → monitor`

## Three repair layers

| Layer | Typical evidence | Owner | Required response |
| --- | --- | --- | --- |
| Tenant knowledge | Missing, incorrect, expired or conflicting fact; wrong URL; incomplete contact or policy information | Client Owner/Admin | Pause if incorrect, create an atomic or superseding claim, complete field and Preview Approval, pass publication regression and retest |
| Shared intelligence | Wrong intent, context loss, repeated clarification, persona boundary error or decision/evidence mismatch | AiFrogi Engineering | Add a universal regression case, repair shared runtime or versioned persona, run affected suites and controlled release |
| Connector/runtime | Failed or unverifiable availability, booking, payment, order or external update | AiFrogi Operations/Engineering | Disable unsafe writes, diagnose connector state, verify tenant isolation, idempotency, read-back and safe failure before certification |

## Admin operating procedure

1. Open the affected bot workspace and go to **Knowledge → Governed improvement routing**.
2. Read the original question, answer, evidence, feedback, flag, knowledge gap and connector status.
3. Classify the defect into exactly one primary layer. Link secondary defects rather than mixing their corrections.
4. Contain first: pause disputed knowledge, suppress conflicts, remove expired facts or suspend unsafe connector writes.
5. Correct the responsible layer under its authority boundary.
6. Run the mandatory approval and regression gate.
7. Retest the original wording, two paraphrases, a contextual follow-up and one unsafe adjacent case.
8. Resolve the evidence only after observed behaviour matches the recorded decision.
9. Monitor recurrence. Reopen or roll back if the same failure family returns.

## Knowledge repair rules

- Add missing truth as one or more atomic claims.
- Correct wrong truth using an explicit version that supersedes the previous claim.
- Verify active URLs before publication.
- Reconfirm unchanged expired truth; edited truth uses the full lifecycle.
- A negative rating is an analytical signal, not authority to change knowledge.
- An explicit incorrect-fact flag pauses the affected claim immediately.
- Client facts, prices, contacts, policies, inventory and commitments never propagate to another tenant.

## Shared intelligence repair rules

- A wording failure affecting more than one business becomes a universal intent or context regression case.
- Persona-specific behaviour changes require a new persona-pack version and category suite.
- Rule 11 changes must preserve the two-cycle clarification limit and circuit-breaker evidence.
- Decision-versus-behaviour consistency must remain a release-blocking meta-test.
- No shared correction may reduce tenant isolation, grounding, action verification or secret protection.

## Connector repair rules

- Read operations may use an explicitly disclosed stale fallback only when policy permits.
- Write operations fail closed.
- Re-enable writes only after authentication, scope, idempotency, read-back and immediate suspension tests pass.
- Never state that a booking, payment, reservation, order or refund completed without verified connector evidence.

## Closure evidence

A repair is complete only when:

- containment is recorded;
- the authorised owner approved the change;
- the relevant regression suite is complete and passed;
- the original question and required variants pass;
- the evidence decision matches observed behaviour;
- no zero-tolerance gate fails;
- the flag, gap or incident contains a resolution note and version reference.

## Product implementation

- The Knowledge workspace displays the three-layer Universal Repair Guide for every tenant.
- Governed improvement routing displays signal, containment state, priority, owner, deadline and next action.
- The Help Center publishes the client-facing repair procedure at `/help/repair-an-ai-bot`.
- Publication and reconfirmation are blocked by atomic, output-safety and Sovereign Common Suite regression checks.
