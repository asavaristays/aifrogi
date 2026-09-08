# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Complete 100-answer audit delivery

- Expand the production bot-family suite from 90 to exactly 100 representative questions.
- Add opt-in full-report mode retaining every complete answer while keeping routine runs failure-only.
- Add an email delivery command that requires exactly 100 results and sends a readable HTML report plus CSV and JSON attachments through configured AiFrogi SMTP.
- Validation: script syntax, TypeScript and whitespace checks pass locally.
