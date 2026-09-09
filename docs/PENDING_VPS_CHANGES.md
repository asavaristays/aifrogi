# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## `TI-011` Tenant Intelligence visual refinement — graphical canvas and sliding panels

- Upgraded the flow canvas with freely draggable, colour-coded nodes, curved SVG connectors, arrowheads and visible Yes/No branch labels.
- Added zoom controls and a fit view for larger workflows.
- Added independently sliding Flow List and Node Settings panels so the canvas can use the available width.
- Added a desktop collapse/expand control for the main client navigation; the content area expands from the former 236 px offset to 72 px while collapsed.
- Node positions are saved per bot with the versioned flow and bounded to a safe canvas area.
- Flow execution, tenant isolation, publication validation and handover behaviour are unchanged.
- Focused flow, navigation, widget lifecycle and security tests passed 28/28; TypeScript, targeted ESLint and the clean 77-page webpack build passed.

## `CI-010` Core Intelligence — timezone-aware first greeting

- All website bots now send the visitor browser's IANA timezone with each message and generate the first greeting using that local time.
- Invalid or unavailable visitor timezones fall back safely to the bot owner's configured business timezone.
- Client Today dashboard greeting and date now use the client's configured timezone instead of fixed India time.
- Shared greeting boundaries are morning before 12:00, afternoon from 12:00–16:59, and evening from 17:00 onward; **Good night** is never used as an opening greeting.
- Added **Good night** to greeting intent so it receives a warm time-appropriate response rather than business retrieval.
- Targeted greeting and answer-behaviour tests passed 24/24; TypeScript, targeted ESLint (no errors), and the 76-route webpack build passed.
