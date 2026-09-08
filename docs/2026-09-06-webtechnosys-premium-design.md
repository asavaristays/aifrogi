# Webtechnosys premium chat design — v1

## Approved scope

Presentation upgrade for the Webtechnosys bot only: clear bot name, premium menu, hover/slide motion and a human handover icon. Other personas retain their existing shell. No knowledge, billing, connector or tenant records modified.

## Design and behaviour

- Header: Webtechnosys AI Bot. Removes generic Sovereign Business Bot / Business Assistant / AI ready labels for this tenant. Actual reconnecting, closed and human-owned states remain visible.
- Black/charcoal surfaces, restrained gold details, rounded icons, compact menu typography. Demo option is visually highlighted.
- Main menu / Chat segmented control with a short sliding indicator; menu screens animate on navigation. No auto-advancing carousel, flashing or perpetual motion.
- Reduced-motion preference disables transitions and transforms; hover effects apply only to fine-pointer devices. Keyboard focus retained.
- Menu and chat presentation are separated without clearing messages or visitor tokens. Messages remain mounted and hidden in the menu view; existing read receipts use visibility intersection.
- Headset + Human help prepares an explicit request in the composer. Visitor must press Send. No request or email is created merely by clicking the icon. Existing draft text is retained. Existing handover endpoint controls persistence and acknowledgement.
- Disabled help control for closed/reconnecting sessions, known unavailable handover, or an in-flight reply. Existing human-requested/joined conversations open Chat instead of creating another request.
- Standalone layout fits viewport height; iframe shell uses viewport height. Composer remains visible while contents scroll.
- Navigation destinations, demo disclaimers, feedback and backend operations unchanged.

## Verification

TypeScript and navigation contract tests passed; whitespace check passed. Build and health validation are required by the deployment script. No browser interaction or visual QA was performed; no real handover request was sent during this design change.

Release target `webtechnosys-premium-20260906`, previous release `demo-typography-20260906`. Existing staged-build, backup and rollback safeguards retained.

Deployment succeeded at 2026-09-06T03:10:52.355Z. Backup: `/var/backups/aifrogi/webtechnosys-premium-20260906.i8VXKK`.
