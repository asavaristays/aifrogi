# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.

## `UI-001` Website widget — close-control rendering

- Replaced the ambiguous minimize glyph with a clear close icon on launcher-mode widgets.
- Locked the icon to the centre of its 40 × 40 px circular control with explicit zero padding, zero line-height and SVG sizing/reset rules so browser styles cannot displace it.
- Allowed the bot identity block to shrink correctly on narrow screens while reserving the close control's full touch target.
- The existing close event and trusted host-loader listener are unchanged.
- Widget lifecycle tests passed 9/9; TypeScript, targeted ESLint with no errors and the clean 76-route webpack production build passed.
