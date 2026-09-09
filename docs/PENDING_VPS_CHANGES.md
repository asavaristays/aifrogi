# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-014` Core Intelligence — sustained-interest callback capture

- A first expression of interest still receives a useful answer without an immediate phone request.
- Two relevant commercial-interest turns within the same conversation make the consented name/mobile callback form available after the answer.
- Direct quote, booking and callback requests retain their immediate contact path; unrelated questions never accumulate into commercial intent.
- The callback prompt and form explicitly state that details remain private/confidential and are used only for that enquiry.
- Focused lead, lifecycle and security tests passed 40/40; TypeScript and targeted ESLint passed with no errors.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
