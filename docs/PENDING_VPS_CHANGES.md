# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## Leads visibility and privacy-safe Super Admin awareness

- Rename the client navigation and `/contacts` workspace from Contacts to Leads while retaining the stable route.
- Show only website visitors who supplied a name, mobile number and explicit follow-up consent; ordinary or anonymous conversations remain in Team Inbox and Reports.
- Present captured leads in a responsive table with deterministic A/Hot, B/Warm and C/Nurture grading, score, recorded requirement context, status and last activity.
- Add Super Admin Command Center awareness by workspace with aggregate totals, grade distribution and unattended count.
- Protect tenant privacy by selecting no visitor identity, contact detail, requirement or transcript for the Super Admin aggregate.
- No database migration. Validation: focused lint, TypeScript, 127/127 channel tests, whitespace checks and a 75-route production build using the webpack compiler after the sandboxed Turbopack worker stalled.
