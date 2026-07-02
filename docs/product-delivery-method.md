# AiFrogi Delivery Method

Every AiFrogi implementation must pass five explicit gates. A feature is not complete because code was merged or a screen looks polished.

## 1. Think

- Identify the primary user and the real job they are trying to complete.
- Capture the current experience and relevant production evidence.
- Separate real capability from mock, planned, or unavailable capability.
- List normal, empty, loading, success, warning, blocked, and failure states.
- Define the business and user risk if the section is confusing or fails.

Deliverable: a short evidence-backed problem statement.

## 2. Rethink

- Remove unnecessary controls, repeated information, and technical language.
- Establish one primary action and clear secondary actions.
- Define information hierarchy, ownership, and progressive disclosure.
- Reuse the product system before adding a new component pattern.
- Write measurable acceptance gates before implementation.

Deliverable: the simplified interaction model and acceptance checklist.

## 3. Implement

- Keep changes inside the selected product section and its shared foundations.
- Use real data and real actions; never add decorative or fake controls.
- Build responsive, accessible normal and edge states together.
- Preserve tenant boundaries, authentication, consent, and auditability.
- Record architectural or data-model decisions that affect later sections.

Deliverable: a bounded, working implementation.

## 4. Test

- Run typecheck, lint, and production build.
- Verify real-data behavior and representative edge states.
- Verify desktop, tablet, and mobile layouts with screenshots and overflow checks.
- Exercise every visible action and navigation destination.
- Check loading, empty, error, blocked, and success communication.
- Verify production health after deployment.

Deliverable: test evidence, not a general assurance.

## 5. Achieve

- Compare the result with the written acceptance gates.
- Record what is live, what remains, and any residual risk.
- Obtain the product owner's rating before starting the next section.
- Reopen the section if the rating or evidence does not meet the target.
- Save the section outcome in product memory.

Deliverable: an accepted product outcome with a score and a truthful status.

## Definition Of Done

A section is achieved only when a new client can complete its primary job without explanation, every visible control is functional, important failures provide recovery guidance, responsive QA passes, production is healthy, and the product owner accepts the result.
