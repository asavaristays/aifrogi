# 2026-07-05 Appointment Journey Separate Product

Reviewed `/Users/manishpurohit/Downloads/Appointment-Journey-Concept-to-Execution-2.pdf`.

Decision: Appointment Journey should be treated as a separate WhatsApp automation product/add-on, not folded into generic AiFrogi workflows.

Product boundary:

- AiFrogi owns WhatsApp/Meta, templates, billing entitlement, inbox, support, and tenant lifecycle.
- Appointment Journey owns booking logic, Google Calendar, Google Sheets mirror, Razorpay payment links, reminders, rescheduling, reviews, and appointment-specific jobs.
- Integration must be through a signed normalized event contract and authenticated send API.

Implementation guidance:

- Build the signed webhook/send contract and tenant provisioning first.
- Keep v1 conversational; WhatsApp Flows can be v1.1 after platform support is confirmed.
- Use Postgres as source of truth. Google Sheets is only a human-friendly mirror.
- Reuse existing AiFrogi automation and WhatsApp primitives carefully, but do not let Appointment Journey depend on raw Meta webhook payloads.
- Keep multi-staff scheduling, branded web booking pages, and visual workflow building out of v1.

Primary implementation brief: `docs/appointment-journey-product-brief.md`.

Implementation slice completed:

- Appointment domain models added to Prisma.
- Signed HMAC contract helpers added.
- Internal tenant provisioning endpoint added.
- Signed AiFrogi webhook intake endpoint added.
- Pure conversational booking state machine added.
- Inbound processor now dedupes messages, persists sessions, reserves outbound actions, and creates placeholder bookings safely.
- Google OAuth start/callback routes added for `https://aifrogi.com/api/appointment-journey/google/oauth/callback`.
- Callback stores the Google refresh token encrypted on `AppointmentTenant`, creates a dedicated secondary Google Calendar, creates the Settings/Services/Bookings/Feedback Google Sheet, and stores both resource IDs.
- Settings > Integrations now exposes the per-client Appointment Journey Google setup card.
- `npm run verify:appointment`, `npm run typecheck`, `npm run lint`, and `npm run build` passed.
