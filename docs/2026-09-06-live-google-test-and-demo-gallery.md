# Live Google test and requested demo gallery

## Observed provider results
- Test label: QA-B4-20260906.
- Booking: cmtp20a5b0009opkxlw2qmb7r.
- Synthetic appointment: 2026-09-07 09:00 Asia/Kolkata.
- Actual production appointment engine used; Calendar private booking ID read back successfully.
- Exactly one matching Bookings sheet row; repeated inbound message reported duplicate.
- No real customer message sent by this test; outbound actions reserved in application logs.
- Test record/event retained for review, not automatically removed.
- Runner printed successful assertions but also reported an abnormal child exit; clean process completion remains unverified. Do not rerun the booking script blindly (it has an existing-run guard).
- These observations are not full concurrency, lost-response, revocation or browser-chat certification.

## Requested opening-screen demo gallery
- Webtechnosys opening chat screen: AI Bot Demos link.
- Category gallery with labelled synthetic data and individually shareable demo URLs.
- Do not expose live customer workspaces or use real connectors for demo transactions.
- Availability check: all eight existing /bot/demo-* URLs returned HTTP 404 (BusinessGPT, ClinicGPT, HotelGPT, DineGPT, eduGPT, PropertyGPT, FlowCart, Custom Bot).
- No broken gallery link deployed. Existing retired demos have not been restored.
- Need fresh isolated demo provisioning (or explicit approval to restore retired demos), then route/answer tests and gallery deployment.
