# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `TI-011` Tenant Intelligence correction — visual flow builder

- Enabled the missing Flow Intelligence sidebar branch icon.
- Replaced the fixed template sequence with a dotted visual node canvas resembling a bounded n8n workflow editor.
- Client Owner/Admin can add, select, edit, connect and delete Main Menu trigger, approved-knowledge answer, message, condition, human handover, consented callback and end nodes.
- Condition nodes support separate Yes and No connections; missing or broken connections block publication with a clear validation message.
- Existing flows migrate safely from the former callback node name and retain tenant isolation, versioning and Main Menu publication.
- This corrects the `TI-011` interface only; Core Intelligence and tenant business facts are unchanged.
- Focused navigation, flow, widget lifecycle and security tests passed 28/28; TypeScript, targeted ESLint and the clean 77-page webpack build passed.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
