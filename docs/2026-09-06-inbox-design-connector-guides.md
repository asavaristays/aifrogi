# Team Inbox and connector-specific guides - 6 September 2026

## Requested scope

Make the client Team Inbox easier to use as a web app; replace generic connector pricing downloads with relevant individual checklists. No connector activation, tenant data changes, pricing entitlement changes or WhatsApp integration work.

## Implemented

- Scoped Team Inbox layout: rounded surfaces, readable controls, keyboard focus, minimum 44px touch controls, reduced-motion support.
- At narrower widths, switch between Queues, Conversations, Reply and Details rather than scrolling through all four columns. Selecting a conversation opens Reply; selecting a queue returns to Conversations.
- Keep current access checks, website-session filtering, reply/takeover/close/resume controls and server-side permissions.
- Header separates messages since review from outstanding human-help requests. Inbox options contain alerts, home-screen instructions and billing. Mark-reviewed handles network failure and prevents repeat submissions while saving.
- Remove WhatsApp-derived connection/AI-mode indicators from the website-only view; use tenant-neutral reply templates rather than hard-coded Webtechnosys wording.
- Seven connector-specific, one-page PDF checklists: Sheets, Calendar, combined Sheets/Calendar, Razorpay, commerce, PMS/channel manager, CRM/custom API.
- Table and PDF builder share one data catalogue to prevent pricing drift. Preserve existing indicative ranges; combined scope requires a quotation. No new automatic fee or checkout SKU.
- General preparation PDF remains in How to Install, not as the pricing table's replacement for specific requirements.

## Limits

Notifications and badges update while inbox is open and depend on browser support. This release does not implement background push or claim universal installability. No message content appears in alerts. Review marker is account/workspace-level, not a per-conversation read receipt.

## Verification

Seven PDFs rendered and visually reviewed, one page each. TypeScript and diff checks passed; core regression 456/456 passed. Pricing tests now validate the shared seven-connector catalogue and each actual PDF signature instead of assuming connector copy lives in the parent component. Browser visual/interaction acceptance is not claimed for this release.

Deployed `inbox-design-20260906` at `2026-09-06T04:52:33.423Z`; backup `/var/backups/aifrogi/inbox-design-20260906.vStBEL`. Public health and pricing content verified, all seven public PDFs returned valid PDF content. Anonymous inbox summary returned 401 and inbox page redirected to login. Initial wrapper syntax failure stopped before production changes; corrected wrapper completed the staged build and deployment gates.
