# AiFrogi Answer Intelligence Standard v1.0

## Product responsibility

AiFrogi is accountable to the client business, and the client business is accountable to its customer. An answer is therefore acceptable only when it is useful to the visitor, faithful to client-approved truth, and traceable by AiFrogi. Technical success or model output alone is not acceptance.

## One system, not bot-by-bot repair

All present and future bots use four centrally versioned layers:

1. **Shared answer constitution** — grounding, privacy, safety, answer-first conversation, contact boundaries and human handover.
2. **Vertical overlay** — tone, subject vocabulary, hard boundaries, commercial signals, required knowledge topics and connector authority for each bot family.
3. **Tenant truth** — structured business facts and approved atomic knowledge belonging only to that customer.
4. **Evaluation gate** — shared safety cases, vertical golden questions, tenant launch questions and replay cases created from real failures.

A shared correction changes the base once. A subject-specific correction changes one vertical overlay. A client fact changes only that tenant's versioned knowledge. No production defect should be patched independently into every bot.

## Adopted rules

The 50-point founder checklist is adopted with five controlled interpretations:

- Availability becomes commercial intent only when vertical evidence shows action intent—for example dates plus occupancy, a requested appointment time, a specific quantity, or a site-visit request.
- A quotation, consultation or human-contact request may open consented contact capture. The bot promises a callback only when a responsible team and response target exist.
- Privacy and security use one immutable boundary, while the customer-facing introduction may use the tenant's business name.
- Answer review records separate factual accuracy, relevance/completeness, tone, safety, next-step quality and sales pressure. `Good / Incomplete / Wrong` remains a summary outcome, not the entire score.
- Callback behavior is standardised centrally, but wording may vary naturally and must use real tenant contact configuration.

## Mandatory launch contract

A bot cannot be declared pilot-ready unless:

- identity, offerings, pricing policy, hours, location/contact, starting or booking process and human support are present where applicable;
- structured facts win over document retrieval for exact business data;
- no unresolved conflict, unsigned publication, stale mandatory fact, open critical flag or placeholder contact remains;
- shared safety, vertical golden and tenant launch suites pass;
- every answer records intent, retrieval path, source/claim version, freshness, decision, latency and outcome without exposing this evidence to visitors;
- human review confirms subject usefulness and tone on a representative sample.

## Answer acceptance rubric

Each reviewed answer receives independent results for:

1. factual grounding;
2. direct relevance and completeness;
3. subject competence;
4. natural tone and voice consistency;
5. safety and authority compliance;
6. useful next step;
7. absence of premature selling or contact capture.

Any factual, isolation, security or unauthorized-action failure blocks release. Style alone cannot rescue a wrong answer, and a safe answer is not automatically a useful answer.

## Clean implementation sequence

### Stage 1 — shared quality kernel

- Extract the answer constitution, style rules, protected refusal language and callback policy into one versioned module.
- Make every persona pack inherit it and expose only controlled vertical differences.
- Store the quality-standard version with answer evidence.

### Stage 2 — knowledge and launch gates

- Define required structured facts and 10–20 subject questions for every vertical.
- Extend onboarding readiness to block go-live on missing essentials, duplicates, placeholders or failed golden cases.
- Preserve tenant knowledge versioning, approval, rollback and isolation.

### Stage 3 — evaluation engine

- Run shared, vertical, tenant and historical-failure suites on every constitution, persona, retrieval or knowledge change.
- Score the seven rubric dimensions and compare automated judgment with human review.
- A frequent automated-pass/human-fail disagreement becomes an evaluator defect and release blocker.

### Stage 4 — production learning loop

- Weekly review of low-confidence, negative-feedback, repeated-question, fallback and handover cases.
- Convert only reviewed failures into regression cases or proposed knowledge corrections.
- Never allow conversations to rewrite production knowledge automatically.

### Stage 5 — measured retrieval evolution

- Prioritise structured facts; run semantic and keyword candidates within a bounded latency budget; select deterministically.
- Improve retrieval only where evidence shows a retrieval failure rather than missing or incorrect tenant knowledge.

## Success measures

Track per bot and per vertical: grounded useful-answer rate, human-review pass rate, automated/human disagreement, avoidable fallback rate, repeat-question rate, unnecessary qualification rate, handover completion and response latency. Cross-tenant administration receives aggregate health only; customer content remains tenant-bound and access-controlled.

## Rollout rule

New bots inherit the latest approved standard automatically. Existing bots migrate as a cohort only after their golden suites pass. Rollout is versioned, monitored and reversible; a failed cohort returns to its prior policy version without changing tenant truth.
