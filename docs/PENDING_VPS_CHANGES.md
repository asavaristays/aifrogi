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
