# Agentic implementation — bounded delivery plan v1

Scope: start with Webtechnosys consultation, then reuse verified controls across personas. WhatsApp and HotelRadar excluded. No synthetic showcase is treated as a live connector certification.

## A — Shared action verification (this change)

Existing implementation already offers Calendar slots, uses deterministic event IDs and verifies newly created events. Sheets reserved-row recovery is deployed.

Confirmed gap: `synchronizeBookingToGoogle` previously skipped provider verification when `gcalEventId` existed and could write CONFIRMED locally on that basis alone.

Fix: always use Calendar read-back. Stored IDs use GET only, never POST. Verify event ID, booking binding, active status, title and both timestamps. Missing, cancelled, moved, foreign, unavailable or still-HOLD events withhold confirmation. Refuse synchronization for cancelled reservations or tenants not GOOGLE_READY. No schema changes, credential changes or live Google test writes.

This is the first shared agentic safety slice, not a completed public booking feature. Payment HOLD promotion remains deliberately fail-closed until a separately verified update path exists.

## B — Website consultation journey (pending)

Reuse appointment services behind tenant-scoped signed visitor sessions; do not trust browser-supplied tenant IDs or phone numbers as identity. Confirm configured connector permissions, live services, availability, consent, final slot confirmation and per-action identity. Cover duplicate/concurrent requests, overlapping slots and changed availability. Keep client activation gated until these checks pass.

## C — Recovery and live acceptance (pending)

Verify rescheduling/cancellation ownership, Calendar uncertain-result recovery, payment-HOLD promotion where applicable, revocation/reconnect and Sheets partial failure. Then perform an explicitly approved real-provider test with fixture cleanup and one consultation acceptance journey. No automatic live bookings during implementation tests.

Each slice must report synthetic tests separately from real-provider acceptance. No 95% accuracy or fully-agentic certification follows from code delivery alone.

## Validation — Part A

- Core regression: 451/451 passed, including 12 new mocked-provider tests.
- TypeScript and whitespace checks passed.
- Provider tests use synthetic responses; no Google account data is changed.
- Deployment target: `agentic-verification-20260906`; baseline: `webtechnosys-premium-20260906`.
- Existing shared adapter is reused; website public action routing is not enabled by this release.
- Deployment succeeded: 2026-09-06T03:35:43.751Z. Backup: `/var/backups/aifrogi/agentic-verification-20260906.spdK4a`.
