# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `UX-005` Public Help Center — AI Bot operating guides

- Removed every WhatsApp and Meta reference/article from the public Help Center catalogue.
- Rebuilt Help around the AI Bot lifecycle: account creation, knowledge upload, answer approval, persona, appearance/Main menu, standalone publishing, website installation, Leads/Team Inbox, credits/Billing, improvement and Support.
- Added clear routing for new clients, ready-to-publish clients and live clients.
- Individual guides now return to All AI Bot guides and route authenticated help to client Support.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
