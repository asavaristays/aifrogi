# Bucket 4 — Calendar/Sheets first

## AI Bot setup separation

Deployed `bucket4-setup-20260906`, readiness `2026-09-05T23:26:07.974Z`, backup `/var/backups/aifrogi/bucket4-setup-20260906.kIKjWf`. Browser verified new AI Bot connector screen and successfully prepared Webtechnosys appointment tenant `cmtp0i0bv000o6rkxnlxknrqk`, one default service, zero bookings, no Calendar/Sheet yet. No WhatsApp credentials or records deleted.

Live certification blocker: Google connect navigation was blocked by browser. Read-only process-environment presence check additionally confirmed GOOGLE_APPOINTMENT_CLIENT_ID and CLIENT_SECRET missing; explicit REDIRECT_URI missing (code has fallback), signing secret configured. Values not printed. Need authorized Google Cloud OAuth client configuration before consent can work. Test-account email alone is not an OAuth application credential. Part C remains open; Part B gaps also remain as documented.

Implemented Google-specific `/settings/integrations`, an authenticated manager-only preparation action with trusted workspace/actor IDs, and channel-neutral appointment setup. Removed WhatsApp prerequisite from service/admin controls. Legacy configuration page retained at `/settings/whatsapp-integrations`; no records or credentials deleted. Local core360/360, VPS focused setup3/3. Setup is not certification of live booking execution; earlier Part B gaps remain open.

## Live setup inspection — approved test scope, blocked before consent

User approved the Webtechnosys workspace and labelled Google test calendar/sheet/appointment. Browser inspection of `/settings/integrations` shows Webtechnosys Client Admin, WhatsApp unconfigured, and Appointment Journey not enabled by Super Admin. Code inspection of `setAppointmentJourneyEnabled` confirms enabling requires WhatsApp CONNECTED. Thus Google appointment setup is still coupled to the legacy WhatsApp flow. No OAuth consent, resource creation or appointment occurred. Do not enable WhatsApp or bypass this gate to claim AI Bot certification. First separate channel-neutral Google setup and execution authority, then resume approved test scope. Google account email was supplied in the conversation; no password requested.

## B1 progress — Calendar creation and callback safeguards

Deployed `bucket4-b1-20260906`; public readiness healthy at `2026-09-05T19:59:51.443Z`. Backup `/var/backups/aifrogi/bucket4-b1-20260906.l8c9pe`. No migration. User supplied proposed Google test account; workspace and resource-creation approval still required before live actions.

Implemented stable SHA256 event ID from calendar+booking identity, duplicate409 recovery by GET, and mandatory read-back of event identity, booking metadata, start/end, active status and summary before creation returns success. A lost transport response is not blindly retried inside the request; later retry uses the same event ID. Google JSON requests now have a15-second timeout. Reference: [Google event IDs](https://developers.google.com/workspace/calendar/api/guides/create-events).

OAuth callback now rechecks current workspace-management permission before exchanging a code or creating resources. Callback error text is HTML-escaped. This is NOT full browser-state binding or durable replay prevention.

Evidence: focused16/16 locally and VPS staging; core357/357; TypeScript pass; existing appointment contract/state-machine/Calendar/Sheet verifier passes after updating its deterministic event/read-back fixture.

Remaining engineering: per-booking Sheets reconciliation; OAuth single-use/browser binding; execution-authority integration; existing stored event IDs still need read-back on reuse; HOLD-to-CONFIRMED reconciliation. New creation verification does not certify those paths. No real Google calls occurred in tests. Part B remains OPEN.

Status: in progress, NOT connector-certified. No real Google account was connected or provider resource created in this batch. WhatsApp remains excluded.

## A — Safe reads and literal data (implemented)

Review found availability lookup used missing/per-calendar error results as an empty calendar, potentially offering unverified slots. Now missing, foreign-calendar, errored, absent-busy and invalid busy periods fail closed. An explicitly successful empty calendar still offers slots. HTTP403 revocation fails safely.

Booking-sheet writes now use RAW so customer text is not parsed as a formula and phone strings retain their literal form. Google documentation: [FreeBusy errors](https://developers.google.com/workspace/calendar/api/v3/reference/freebusy/query), [RAW value mode](https://developers.google.com/workspace/sheets/api/reference/rest/v4/ValueInputOption).

Evidence: eight isolated provider-transport tests pass locally and on VPS staging; full local core349/349, TypeScript pass. Runtime file: `lib/appointment-journey-google-oauth.ts`. These tests replace fetch, not a live Google certification.

## B — Booking writes and authorization (next, required before certification)

- Event creation currently depends on the database retaining the returned Google event ID. A successful provider write followed by a lost response/database failure can duplicate on retry. Add provider-stable idempotency and recovery/read-back assertions.
- Sheet append deduplication uses one last-booking cursor per tenant. Interleaved retries can duplicate rows. Replace with per-booking durable synchronization evidence and reconciliation.
- Verify event ownership, booking identity, time/status and provider read-back before claiming successful completion.
- Review OAuth callback caller/tenant binding, replay resistance, minimum scopes, revocation, resource mapping and encrypted credential lifecycle.
- Shared connectorMayAct reports allowed=true with a human-approval reason for operations requiring approval. Audit call sites and require explicit verified approval before any execution; the reason string is not enforcement evidence.
- Verify request timeout, partial-success reconciliation, no unsafe blind retries and visible operator errors.

Do not enable production booking writes merely because Part A passed. Existing bookings or connections have not been disabled or modified by this review.

## C — Live certification (requires explicit test scope)

Select a dedicated Google test account and named test tenant; authorize OAuth in the browser, never share a password. Approve creation of a clearly labelled test Calendar/Sheet and reversible synthetic appointments. Then verify mapping, availability, create/read-back, repeat submission, lost response, revocation, reconnect and cleanup. Record provider IDs without secrets. No live certification claim until these steps pass.

PMS/commerce follow demand-led separate provider certification, not inherited approval from Google. Reviewed client accuracy remains Bucket5.

## Deployment evidence

Release `bucket4-a-20260906` deployed after successful VPS build and8/8 isolated tests. Public readiness verified `2026-09-05T19:54:11.237Z` (6 September IST). Backup `/var/backups/aifrogi/bucket4-a-20260906.WFdK5l`. No schema migration. Part B and live Part C remain open.

Call-site check found connectorMayAct used by evaluation/tests, not production appointment execution. Wiring enforcement into real write paths is therefore an explicit Part B requirement, not a completed control.
