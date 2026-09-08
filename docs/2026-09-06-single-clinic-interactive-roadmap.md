# Single-clinic interactive experience

## Implemented first slice
- ClinicGPT showcase opens with service, eligible dentist, date, available time, review and simulated confirmation.
- Deterministic fictional schedule; occupied times, service durations and doctor eligibility checked.
- Back, change, cancel and free-text clinic question controls.
- Browser-session simulation only, not shared inventory or real reservations. No patient data collected.
- Three availability tests and TypeScript passed; core suite result tracked separately.

## User-requested returning-patient experience
Target: verified patient sign-in -> scoped patient match -> discreet greeting -> explicit request to display visit summary -> follow-up/new appointment.

Do not display medical history based only on a supplied phone number, name, QR link or public chat session. Existing Google connection is provider authorization, not patient authentication.

### A: Synthetic demonstration
- Implemented fictional Asha profile selection, optional last-visit reveal/hide and follow-up scheduling shortcut. Clearly marked as not authentication; no real history read.
- Clearly labelled fictional patient profiles; demo profile selection is not real authentication.
- Show minimal previous visit summary only after a deliberate reveal action.
- Support new visit, follow-up, change and cancel; keep medical advice out of booking logic.

### B: Real single-clinic controls (required before patient data)
- Clinic-owned approved Sheet, minimal structured columns and stable patient IDs.
- Verified patient access (OTP or clinic-approved patient portal), expiry, rate limits and lockouts.
- Tenant-scoped lookup; ambiguous or multiple matches do not disclose records.
- Separate scheduling data from clinical notes. Collect/display only the minimum authorized fields.
- No real patient information in demo fixtures, public links, analytics or general AI training.
- Access audit and human staff review for discrepancies; explicit policy for minors/guardians and shared phone numbers.
- Live availability, idempotent booking/reschedule/cancellation and provider read-back.

### C: Acceptance
- Identity mismatch, shared phone, expired session, cross-patient and cross-tenant denial tests.
- Returning-patient history not visible before authentication and reveal choice.
- Complete new and follow-up journeys, unavailable-slot alternatives and interruption recovery.
- Provider outage, retry, cancellation and duplicate tests; no false success.

No live patient Sheet access authorized or performed by this work. Current Webtechnosys Google resources are not a clinic patient database.

## Verification
- Core suite: 364/364 passed before the returning-profile presentation addition.
- TypeScript passed after the returning-profile addition; three deterministic availability tests passed.
- Interactive appointment release deployed at 2026-09-06T00:42:43.858Z; rollback /var/backups/aifrogi/clinic-interactive-20260906.s8euT9.
- These are implementation checks, not full browser journey acceptance or medical/patient-record certification.
