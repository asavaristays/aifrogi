# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.

## Billing — effective AI reply balance and hard stop

- Client Billing now shows one truthful AI reply bar using plan allowance plus active purchased/free credits, with used, total and remaining values.
- New credit grants and verified purchases expand the available balance immediately; historical usage is retained rather than falsely erased.
- Website-bot replies now enforce the same server-side AI reply entitlement and return a clear Billing action when all plan and added credits are exhausted.
- Super Admin customer register shows credits remaining and added; customer billing detail uses the same effective allowance bar.
- Super Admin health calculation now assesses AI usage against plan allowance plus active credits instead of the base plan alone.
- Focused billing tests passed 9/9; TypeScript, targeted ESLint and the 76-route webpack production build passed.
