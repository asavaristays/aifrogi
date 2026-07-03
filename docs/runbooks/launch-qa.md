# AiFrogi Commercial Launch QA

## Automated Gate

Run from a production-equivalent environment:

```bash
npm run lint
npm run typecheck
npm run build
npm run verify:all
```

The launch verifier checks Help Center completeness, product-film and caption presence, runbooks, database readiness, organization existence, open incidents, and dead automation jobs.

## Manual Journey

1. Marketing: home, pricing, tour, Help Center, security, privacy, terms, disclaimer, and deletion pages work on mobile and desktop.
2. Registration: create a trial with a new email, activate the owner, and confirm client access does not reach Super Admin.
3. Onboarding: complete business data, number path, Meta status, test outbound, and inbound reply.
4. Inbox: keyboard navigation, reply, assignment, notes, handoff, opt-out, and failure guidance.
5. Campaign: approved template sync, consent evidence, internal test, cost confirmation, small batch, and analytics.
6. Automation: idempotent event, retry, pause, resume, dead-letter evidence, and human intervention.
7. Billing: trial allowance, plan change, invoice issue, payment evidence, usage warning, and customer health.
8. Operations: health alerts, encrypted backup, restore drill, incident lifecycle, audit trail, and support ticket.

## Accessibility

- Keyboard-only completion with visible focus and no traps.
- Skip link reaches the main content.
- Headings and landmarks are ordered.
- Inputs have persistent labels and errors are understandable without color.
- Text and controls remain usable at 200% zoom and narrow mobile width.
- Reduced-motion preference removes non-essential animation.
- Product video includes English captions and a static poster.

## Browser And Device Matrix

- Current Chrome and Edge on desktop.
- Current Safari on macOS and iPhone.
- Current Chrome on Android.
- Desktop widths 1280 and 1440; mobile widths 375 and 390.

## Release Decision

Do not launch paid acquisition with a failing readiness check, unresolved SEV-1/SEV-2 incident, failed restore drill, broken inbound or outbound messaging, or a critical accessibility blocker. Record product-owner acceptance and the deployed Git commit.
