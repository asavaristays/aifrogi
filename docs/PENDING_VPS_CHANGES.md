# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `PS-001` Website-bot v1 product simplification

- Client Settings now contains only Team access and Security; duplicate Setup/Billing and deferred WhatsApp surfaces are removed.
- Website onboarding no longer asks for KYC, GST, business proof or WhatsApp setup, and its readiness calculation follows the website-bot journey.
- Client Intelligence and Today no longer repeat Improve My Bot or Billing controls.
- Super Admin customer review no longer exposes KYC/GST/business-document actions.
- Message Matrix is removed from navigation and redirects to Billing; immediate, audited free-credit grants are available inside each customer Billing record.
- Contracted connector/add-on controls and columns are hidden while existing database records remain intact.
- Leads no longer exposes WhatsApp wording/filter/navigation; existing records remain available.
- The public Integration page redirects to Solutions, its footer link is removed, and deferred WhatsApp support category is hidden.
- Focused cleanup tests pass 28/28; TypeScript and targeted ESLint pass without errors.
- Deployment rule: deploy separately from `CI-010`.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
