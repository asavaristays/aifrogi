# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Intelligence · agentic lead qualification v1

- Activate progressive, one-question-at-a-time qualification only for genuine commercial intent and bots with both approved lead capabilities.
- Persist need, timeline, budget, market, score, priority and optional consented contact to the tenant-bound lead/session.
- Show enquiry progress in the widget and a qualification summary with follow-up recommendation in Team Inbox.
- Files: `lib/lead-qualification.ts`, `app/api/public/website-bot/[slug]/route.ts`, `components/website-bot/website-bot-embed.tsx`, `components/whatsapp/whatsapp-bot-client.tsx`, `tests/channels/lead-qualification.test.ts`.
