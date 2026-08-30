# AiFrogi Reliability & Support-Load Engineering Framework v1.0

Status: Adopted engineering standard; certification requires evidence.  
Authority: child standard of the Sovereign Intelligence Rule Book.  
Scope: every bot category, tenant, channel, model call, connector and business action.

## Business invariant

AiFrogi must keep cost-to-serve from scaling linearly with bot installations. A rising live-call rate is an upstream product defect to diagnose, not a staffing requirement to normalize.

## Five-layer failure taxonomy

Every governed turn records one primary layer: `MODEL`, `KNOWLEDGE`, `CONNECTOR`, `CONVERSATION_STATE`, `INFRASTRUCTURE`, or `NONE`. Evidence also records a stable failure code, latency, attempt count, degraded-mode state and escalation tier.

## Runtime controls

- Model calls operate inside a total response budget with per-attempt timeouts.
- Only transient failures retry, using exponential backoff and jitter.
- A configured fallback model may answer one turn, but its use is visibly recorded as degraded mode.
- Empty or malformed output is rejected before delivery.
- Generated commercial and action claims still pass Sovereign claim validation.
- Material connector writes require permission, idempotency and authoritative read-back.
- Failed or unverified writes can never be described as successful.
- Read fallback may use an approved last-known value only with its captured freshness; write fallback never guesses.
- Conversation state is checkpointed after each website turn and Rule 11 bounds repeated clarification.
- Degradation remains tenant-bound. One tenant may never consume another tenant's error budget or data.

## Escalation ladder

1. `TIER_0_SELF_RESOLVE`: governed answer, bounded retry, clarification or transparent limitation.
2. `TIER_1_BUSINESS_ASYNC`: the client's team replies inside the conversation.
3. `TIER_2_AIFROGI_ASYNC`: an attributable platform, model or connector defect enters AiFrogi support operations.
4. `TIER_3_LIVE_CALL`: manually reserved for genuine outage or safety-critical coordination; never selected merely because a bot lacks knowledge.

Initial operating targets—not certified claims—are Tier 0 ≥85%, Tier 2 <2%, Tier 3 <0.5%, connector write duplication 0%, and cross-tenant impact 0%.

## Section 7 reliability certification

The machine-readable checklist is `lib/reliability/grading.ts`. Isolation under failure, duplicate-action prevention and false action completion are BLOCKER controls. Timeout/retry presence alone is not certification: production evidence, a measured support-load sample, canary records and chaos-recovery evidence remain mandatory.

## Release policy

- Conservative defaults preserve the current path when fallback models are not explicitly configured.
- Constitution and Root-layer changes require canary rollout.
- Every corrected production failure creates a permanent regression case.
- No numeric reliability, accuracy or live-call claim is marketed without a non-zero, reproducible production sample.

