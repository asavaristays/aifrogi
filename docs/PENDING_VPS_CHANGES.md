# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `UX-007` Super Admin bot approval decision

- Added explicit **Approve and Make Bot Live** and **Not Approved · Request Correction** decisions to each AI Bot installation review.
- Approval remains gated by active billing/trial, approved tenant knowledge, required connector readiness and detected installation; successful approval activates the bot and sends the existing live confirmation email.
- Decline requires a correction reason, keeps the bot offline, records the decision in the audit activity and emails the client with the required correction.
- Mail-server acceptance is reported separately from inbox delivery, with a Support fallback when notification sending fails.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
