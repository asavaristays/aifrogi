# Team Inbox / connector preparation — launch slice v1

Delivered: authenticated `/team-inbox`, reusing website conversation reply controls; AI-only sidebar entry; public Team login opens secure login separately; workspace/operator-scoped unread markers; pending-human count; 20-second refresh; optional browser notifications while the page runs; feature-detected app badge and standalone manifest. No private message content in alerts. No new password form or public admin permissions.

Unread definition: website GUEST messages after the account's last explicit workspace review marker. Reviewing counts is not resolving a human-help request. Existing reply permissions remain enforced by the existing inbox endpoints. Badge is unread messages, not sum of messages plus requests. Unsupported browsers retain visible counters. This is not push delivery while the app is closed; no push subscription/service worker/VAPID pipeline has been created.

Connector PDF: two pages, visually inspected; safe customer preparation for Sheets, Calendar, Razorpay, PMS; current published indicative setup ranges and exclusions; linked from Pricing and How to Install. No secrets requested by email. Billing link added; no unapproved top-up prices or checkout products created.

Validation: TypeScript passed; five stubbed API tests passed (anonymous, tenant/operator scoping, cross-origin, future cursor, review does not close request). These are not real-client notification delivery tests. Real-device install/badge/notification acceptance remains required. Existing email fallback was not re-tested in this slice.

Remaining: background web push, live account acceptance of counters/reply flow, approved usage-pack prices and billing integration. Release target `team-inbox-20260906`, baseline `premium-sales-20260906`. No database migration.

Deployed at 2026-09-06T04:05:37.030Z; backup `/var/backups/aifrogi/team-inbox-20260906.WHmq4v`. Full regression 456/456 passed after updating the obsolete Premium fixed-price expectation to the user-approved sales contact. Initial run 455/456; no failures concealed.
