# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `UX-002` Public Resources — self-serve visual onboarding center

- The public top navigation contains Resources and no WhatsApp API item on desktop or mobile.
- Resources now follows one six-step client route: signup, knowledge upload, answer training/approval, appearance and Main menu, testing/installation, and daily operation/improvement.
- Each guide includes a privacy-safe screen preview, exact steps and a direct next action without exposing client data.
- Added concise guidance for personas, AI credits, callback privacy, missing-answer handover, support access and client Support.
- The Resources page contains no WhatsApp material; backend/channel code is unchanged.
- Marketing navigation tests passed 2/2; TypeScript, targeted ESLint and the clean 77-page webpack build passed. Desktop browser visual review passed.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
