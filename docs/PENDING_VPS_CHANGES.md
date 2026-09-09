# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-013` Core Intelligence — conclusive missing-answer recovery

- Any result not classified as a verified `ANSWER` is withheld instead of being shown as a vague or potentially useless response.
- The fallback states that verified information is unavailable, confirms that the enquiry is being sent to the business team, requests the visitor's name/mobile through the existing consent form and displays the tenant's configured public phone when available.
- Contact submission now explicitly requests human handling, persists the phone/name and enquiry in Leads, and places the conversation in Team Inbox when handover is enabled.
- Off-topic and sensitive-message safety responses do not trigger this commercial callback flow.
- Successful verified answers continue normally and do not ask for a mobile number.
- Focused security and widget lifecycle tests passed 23/23; TypeScript, targeted ESLint and the clean 77-page webpack production build passed.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
