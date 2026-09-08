# AiFrogi agentic lead qualification v1

## Product boundary

This is AiFrogi's first small-scale agentic capability. It advances a customer enquiry toward a useful business outcome, but it does not book, charge, message an external system or make a commercial commitment.

The capability runs only when the tenant has both `CAPTURE_LEADS` and `QUALIFY_LEADS`. Ordinary knowledge questions remain ordinary answers. Commercial intent activates qualification.

## Customer journey

1. Detect a genuine commercial enquiry.
2. Reuse facts already supplied in the conversation.
3. Ask only one missing question per turn.
4. Capture need, timeline, budget, market and decision role, then ask for a consented callback name and mobile number as the final step.
5. Stop asking any unanswered field after two attempts.
6. Calculate a transparent 0–100 score and Cold, Warm or Hot tier.
7. Persist the profile to the tenant-bound lead and visitor session.
8. Recommend continued qualification, review or priority follow-up in Team Inbox.

Callback details require a name, explicit checkbox and plausible mobile number. The consent statement, time and supplied mobile remain visible to the business. A visitor may decline and continue with in-chat assistance, but the lead is not marked handoff-ready without the mobile number.

## Score weights

| Fact | Weight |
| --- | ---: |
| Business need | 30 |
| Timeline | 20 |
| Budget | 15 |
| Market/location | 10 |
| Decision role | 10 |
| Consented contact | 15 |

Warm begins at 45 and Hot at 75. A lead becomes Qualified when need, timeline and budget are known. A qualified lead with consented contact becomes handoff-ready.

## Cost and safety

- Qualification is deterministic and makes no additional model call.
- Tenant ownership continues to come from the signed website visitor session.
- Existing message lock and persistence transaction prevent concurrent duplicate turns.
- The qualification state is versioned as `1.0`.
- External actions remain unavailable in this version.
- Pilot results must be used to tune questions and score thresholds; code completion is not conversion evidence.
