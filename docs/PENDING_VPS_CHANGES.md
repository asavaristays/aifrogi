# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.

## `CI-007` Core Intelligence extension — human-handover session recovery

- Human ownership remains fail-safe: AI does not answer inside a conversation after the business team has joined.
- The widget now explains that state and labels the composer **Message the business team…** instead of implying the AI will respond.
- Added **Start a new AI chat**, which deliberately creates a separate visitor session, clears the old capability from browser storage and restores the bot welcome state.
- Team-bound messages remain visible without adding the same automated “message saved” bubble after every turn.
- The change applies to every current and future website bot; no tenant facts or knowledge were changed.
- Widget lifecycle tests passed 10/10; TypeScript, targeted ESLint with no errors and the clean 76-route webpack production build passed.
