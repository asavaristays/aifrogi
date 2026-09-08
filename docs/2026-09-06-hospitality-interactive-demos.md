# HotelGPT and DineGPT guided demos — 6 September 2026

## Scope
Only showcase-hotelgpt and showcase-dinegpt opening screens use the new shared guided component. ClinicGPT remains unchanged. Real clients, knowledge and Google connectors are not modified.

## HotelGPT
Check-in -> 1–3 nights -> 1–4 guests in one room -> available room -> review -> simulated confirmation. Each occupied night and room capacity is checked. Totals derive from nights and fictional nightly rate. No-result selections offer dates with checked inventory.

## DineGPT
Date -> party size -> capacity-matched 90-minute table slot -> review -> simulated confirmation. Occupied intervals excluded, last seating 21:30 before 23:00 close. Oversize groups receive an explicit staff-assisted suggestion, not a false reservation or notification.

## Shared behaviour and limits
Back, change, cancellation and free-text question entry/return controls. Confirmation revalidates the selected inventory. Fictional inventory and session-only state: no shared reservations, provider calls, payment or notification. Switching to question mode or reloading resets the guided simulation. Free-text answers do not consume this guided selection state; this is not a fully integrated conversational booking engine.

## Verification
Eight new deterministic inventory tests passed. TypeScript passed. Core regression 372/372 passed. Browser interaction acceptance remains for user review; no claim of real-world booking certification.

VPS deployment and readiness succeeded: hospitality-interactive-20260906 at 2026-09-06T00:50:33.649Z. Rollback: /var/backups/aifrogi/hospitality-interactive-20260906.BSnohb.
