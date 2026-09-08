# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Beta website-bot answer and visitor boundary

- Replace the robotic constitutional greeting with a warm response that mirrors morning, afternoon, evening, Namaste or a neutral hello.
- Introduce the configured bot name only once, welcome the visitor naturally and ask what outcome they hope to achieve.
- Guide generated answers to acknowledge the visitor's goal and use natural language without exposing phrases such as “approved questions”.
- Remove internal enquiry progress, score and cold/warm/hot tier from both the public API response and visitor widget; these remain server-side and visible to the client team.
- Prevent qualification questions from being appended after an unverified, failed or unavailable answer.
- Replace a model-generated trailing offer with the qualification question so one reply never presents two competing questions.
- When the model is unavailable or its output is rejected, serve the highest-ranked matching published claim verbatim; otherwise use a plain business-team fallback without exposing AiFrogi internals.
- Preserve approved-knowledge grounding, safety boundaries and model-call volume.
- Validation: focused lint, TypeScript, 131/131 channel tests, whitespace checks and a 75-route production build.

## Bot-family qualification and regression gate

- Prevent ordinary discovery phrases such as “interested”, “want”, “need”, “project”, “start” and “demo” from activating sales qualification.
- Begin timeline, budget and other discovery only after an explicit commercial action such as a quotation, proposal, hiring, implementation or booking request.
- Add a reusable regression runner for Webtechnosys plus eight showcase bot families, capped at 1,000 replies, with bounded concurrency, systemic/privacy early-stop and failure-only evidence.
- Add `npm run verify:bot-family`; default execution is 90 representative tests and can be expanded without changing code while never exceeding the 1,000-credit ceiling.
- Add an idempotent, audited 1,000-credit QA grant command with 30-day expiry; repeated execution cannot duplicate the grant.
- Validation: 133/133 channel tests, TypeScript, script syntax, whitespace checks and a 75-route production webpack build.
