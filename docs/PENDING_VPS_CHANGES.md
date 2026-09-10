# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-015` Delivery-independent Super Admin go-live

- Standalone web app or website installation is the client's delivery choice; website detection is informational and no longer blocks Super Admin approval.
- Super Admin approval remains gated by active account access and approved tenant knowledge. External connectors block only action-performing operating modes.
- Approval makes the shared bot runtime live for standalone and website delivery, triggers the existing client live email and leaves existing AI-reply entitlement accounting/hard-stop enforcement unchanged.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
