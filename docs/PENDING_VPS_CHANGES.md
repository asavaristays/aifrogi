# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.

## `CI-012` Core Intelligence — direct business request routing

- Self-contained requests such as **Share training program details** now route directly to the tenant's approved knowledge instead of being mistaken for a context-only follow-up.
- Genuine follow-ups such as **Give me the link to book** still use the latest relevant business question.
- Off-topic lookalikes such as weather, cricket and stock-price detail requests remain blocked from business retrieval.
- Visitor feedback no longer exposes internal terms such as **review dataset** or instructions to flag a fact; it uses concise customer-facing language.
- No Webtechnosys or other tenant knowledge, facts or training records were changed.
- Focused Core, retrieval and security tests passed 47/47; TypeScript, targeted ESLint and the clean 76-route webpack production build passed.
