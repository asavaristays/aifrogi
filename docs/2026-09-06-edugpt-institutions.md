# eduGPT institution-specific demo

Approved scope: School, College and Coaching; other demos unchanged.

- Opening institution selector resets all selections when changed.
- Each institution has relevant programmes/classes, admissions process, illustrative fees, document preparation and public facilities information.
- School/college academic year and coaching intake selections.
- Weekday date/time choices, review, simulated request, change and cancellation.
- Existing student/parent support does not look up records: explicitly requires verified institutional portal access.
- No uploads, student login, payment, external notification, admission or seat allocation.
- Public free-text coaching chat is not shown within this multi-institution demo, preventing an unrelated coaching KB from answering school/college questions.

Testing: TypeScript passed; core suite 386/386 passed, including six new institution-scoping and appointment-validation tests. Full browser interaction acceptance remains for user review. All content is fictional; appointment options are fixed demo availability, not live calendar capacity.

Deployment: education-institutions-20260906; readiness confirmed 2026-09-06T01:06:27.583Z. Rollback backup: /var/backups/aifrogi/education-institutions-20260906.7aWC4q.
