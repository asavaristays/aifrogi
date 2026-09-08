# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Intelligence · qualified callback threshold

- Withhold the mobile form until qualification reaches 60 points with a real business need and timeline or budget evidence.
- Highlight the form only when callback capture becomes the justified final step; weak enquiries continue without a mobile request.
- Files: `lib/lead-qualification.ts`, `app/api/public/website-bot/[slug]/route.ts`, `components/website-bot/website-bot-embed.tsx`, `tests/channels/lead-qualification.test.ts`.
