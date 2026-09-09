# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CAP-001` Capacity Advisor — absolute storage headroom

- Capacity now calculates VPS disk total, used and available gigabytes in addition to utilization percentage.
- Super Admin Capacity shows the available space directly and states whether headroom is healthy or bounded cleanup should run before a storage upgrade.
- The existing 75% amber and 90% red disk thresholds remain unchanged.
- Focused capacity tests pass 5/5; TypeScript, targeted ESLint and a clean 76-route webpack build pass.
- Deploy separately from pending Core Intelligence `CI-010`.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
