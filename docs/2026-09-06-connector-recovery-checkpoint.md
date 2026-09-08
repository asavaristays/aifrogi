# Connector recovery — 6 September 2026

Update: reserved-row recovery implemented and deployed as `bucket4-sheet-recovery-20260906`, deployment health verified `2026-09-06T02:19:58.143Z`. 439/439 local core, 7/7 database/simulated-provider and 17/17 staging authenticated checks passed. Fresh public health recheck blocked by approval usage limit. Details and residual operator/provider limits: `2026-09-06-project-review.md`. The helper-only checkpoint below is historical; Bucket4 as a whole remains open.

5C remains deferred by the user, not closed. Resumed Bucket 4; WhatsApp excluded.

Confirmed in `synchronizeBookingToGoogle`: one `Bookings` cursor per tenant stores the last booking ID. A/B/A retries can append A twice. Cancellation separately appends another row. A successful Google append followed by failed database persistence is also uncertain and cannot be fixed by a new cursor alone.

Added local per-booking/per-sheet identity and full-content revision helper with five tests. Not wired into runtime and not deployed: integration must also reconcile existing provider rows, serialize concurrent writes, distinguish update vs append and preserve unknown-result failures. Never claim this helper alone prevents duplicate bookings.

Next acceptance cases: A/B/A; same-booking concurrent retries; lost provider response; lost DB acknowledgement; duplicate existing rows; cancellation updates; revoked provider access; verified row read-back. Retain operator-visible failure instead of blind reappend when the outcome is unknown.

Google supports reading a value range and updating a specified range using RAW values. References: https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/get and https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/update. Those operations alone do not provide transactionality across Google and the application database.
