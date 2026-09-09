# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.

## `TI-011` + `TI-012` Tenant Intelligence — Flow Intelligence and conclusive handover

- Added a per-bot **Tenant Intelligence → Flow Intelligence** workspace with four governed templates: service advice, pricing, booking and customer support.
- Client Owner/Admin can create, edit, save, approve/publish, pause and delete a flow. Publishing versions it and connects it to that bot's Main Menu; a full six-option menu blocks publication explicitly rather than dropping an item.
- Every flow follows one controlled path: Main Menu trigger → approved tenant answer → human chat if unresolved → consented callback capture.
- Unresolved answers now state the limitation professionally and expose consented name/mobile capture while offering an in-chat team response. No unsupported answer is presented as fact.
- Human ownership remains fail-safe: AI does not answer inside a conversation after the business team has joined.
- The widget now explains that state and labels the composer **Message the business team…** instead of implying the AI will respond.
- Added **Start a new AI chat**, which deliberately creates a separate visitor session, clears the old capability from browser storage and restores the bot welcome state.
- Team-bound messages remain visible without adding the same automated “message saved” bubble after every turn.
- The implementation remains tenant-bound; Core Intelligence and client facts were not changed in this package.
- Focused Tenant Flow, handover, widget lifecycle and security tests passed 24/24; TypeScript and the clean 77-page webpack production build passed.
