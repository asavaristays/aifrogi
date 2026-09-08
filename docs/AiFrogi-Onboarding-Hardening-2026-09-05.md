# Onboarding hardening — 5 September 2026

## Implemented in this correction

- Public website/standalone runtime requires LIVE, never legacy CONFIGURED.
- Final activation always checks knowledge readiness, active subscription and customer status; missing framework metadata is not an exemption.
- Trial UI uses subscription plan, not legacy metadata. Trial readiness checks five distinct approved topics (identity, offering, contact, starting/booking, human support) and the existing freshness, conflict, sign-off, preview and flag checks.
- Paid readiness retains category coverage. Connector verification remains required for action modes.
- Knowledge preparation is no longer described as public launch; the test step is not falsely marked complete.
- Live confirmation email has SMTP-acceptance/failure audit entries and an admin retry action. SMTP acceptance does not prove inbox receipt. Retry deduplication is best-effort; this is not a transactional email outbox.
- Installation mail failure is surfaced instead of silently hidden.
- Coverage matching excludes generic filler, includes limited contact/price synonyms and maps FlowCart to commerce. It remains a heuristic checklist, not an accuracy measurement.
- Empty tenant settings no longer default to HotelRadar or a global source URL.
- Widget theme applies to visitor bubbles and send button with contrast-aware text. Logo URLs require HTTPS without credentials.

## Evidence

- Local core suite: 177/177 passed after policy/coverage changes.
- TypeScript passed; production build passed.
- Lint: zero errors, 17 warnings (not a warning-free codebase).
- VPS preflight: one DRAFT and one INSTALLATION_DETECTED profile; no CONFIGURED/LIVE profiles at the time of inspection.

## Not certified / follow-up

- 8.5 is not certified by these tests. Real private-pilot acceptance remains required.
- Logo file upload, a complete single-screen wizard, and automatic mail-outbox retry remain unfinished; existing logo URL/manual retry are available.
- Do not silently approve customer facts to meet a checklist. Topic labels are only an aid; a human must verify the actual answer.
- Live SMTP inbox receipt, new-client registration through activation, and billing suspend/resume need end-to-end acceptance evidence.
- No client records were deleted or approved during this correction. No database migration is needed.

## Acceptance sequence

### Live email template correction

User confirmed receipt of the original plain-text live email, but rejected its formatting. Added reusable branded HTML matching the installation-kit logo, black header, gold action and grey support footer, with a plain-text alternative and escaped customer fields. Local suite: 179/179; TypeScript passed. Existing sent mail cannot be restyled retroactively; this change governs subsequent live notifications. No additional email was sent as part of the template edit.

### Authenticated client check

Webtechnosys client UI showed 8 approved answers, 32 crawled pages, 4/5 trial essentials; business identity is missing. Training question returned the correct training-booking URL. Weather was refused as outside business scope. Phone test initially failed: structured profile returned email/website before consulting published claims. Fixed the retrieval order and prevented partial profile contact responses when the specifically requested field is absent. Published-claim blocking checks now precede profile fallback. Deployed `contact-fix-20260905`; production build and health passed, local suite 177/177. Live UI retest returned `+91-7410582898` correctly.

These are independent client-preview questions, not a verified multi-turn session stress test. No business facts were added or approved. Identity approval and final Super Admin launch/email receipt remain pending. Rollback: `/var/backups/aifrogi/contact-fix-20260905.0ADzjE`.

Deployment completed on VPS, release `hardening-20260905`. Staging production build passed and the aligned suite passed 177/177. Two stale VPS test fixtures were synchronized with existing local fixtures; the missing operational preflight module was included. Runtime health passed after activation. Previous build and verified source archive retained at `/var/backups/aifrogi/hardening-20260905.MM0Wmb`. No schema migration or knowledge approval was performed.

1. Fresh trial: website or document/manual knowledge, essential topics, appearance.
2. Check answers privately, including unrelated question then return to topic.
3. Confirm installation; Super Admin approves only after review.
4. Verify visitor access and actual receipt of live email.
5. Pause and verify serving stops; restore requires approval again.
6. Verify billing restriction/resumption on a test account, not a client's payment record.

Do not convert synthetic pass rate or topic coverage into a claimed customer-answer accuracy score.
