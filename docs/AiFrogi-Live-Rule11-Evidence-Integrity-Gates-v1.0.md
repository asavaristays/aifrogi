# AiFrogi Live Rule 11 and Evidence Integrity Gates v1.0

Status: implemented release controls. These gates provide evidence for controlled pilots; they do not claim real-world accuracy or certification by themselves.

## Decision–behaviour consistency gate

Every new sovereign answer evidence record stores both the declared decision and an independently classified observed behaviour: `ANSWER`, `CLARIFY`, `REFUSE`, `ESCALATE`, `FALLBACK`, or `ACT`.

- A connector action is compatible only with a declared `ANSWER` after authority and connector checks succeed.
- A refusal, escalation, fallback, or clarification recorded as an ordinary answer is a mismatch.
- Legacy records are marked `UNKNOWN` and excluded rather than retroactively guessed.
- Any classified mismatch in a demo tenant fails `verify:persona-demos` and blocks the release gate.

## Live Rule 11 stress gate

`npm run verify:live-rule11` exercises all eight persona demos against the running HTTP service. Each persona must pass six gates:

1. First incomplete request produces one useful clarification.
2. A repeated unresolved request exits through escalation rather than looping.
3. A third repeat proves the circuit breaker remains locked.
4. Supplied slots are retained across turns.
5. An off-topic interruption is safely refused without erasing the active task.
6. The returning customer supplies the remaining slot and the authorised mock action completes.

The release result is withheld unless all 48 cases pass. A pass supports a small controlled canary only; production accuracy still depends on client-approved knowledge, connector evidence, feedback, and monitored real conversations.
