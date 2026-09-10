# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `UX-003` Public header — final four-item navigation

- Desktop and mobile public headers contain exactly: Home, AI Bot, How to Install and Pricing.
- Resources remains available through the footer and direct URL; Founder remains in the footer only.
- WhatsApp API remains absent.
- Marketing navigation tests passed 3/3; TypeScript, targeted ESLint and the clean 77-page webpack build passed.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
