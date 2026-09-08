# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Warm website-bot conversation tone

- Replace the robotic constitutional greeting with a warm response that mirrors morning, afternoon, evening, Namaste or a neutral hello.
- Introduce the configured bot name only once, welcome the visitor naturally and ask what outcome they hope to achieve.
- Guide generated answers to acknowledge the visitor's goal and use natural language without exposing phrases such as “approved questions”.
- Preserve approved-knowledge grounding, safety boundaries, qualification logic and model-call volume.
- Validation: focused lint, TypeScript, 128/128 channel tests, whitespace checks and a 75-route production build.
