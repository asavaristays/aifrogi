# Webtechnosys opening navigation — v1

## Scope

Approved opening-menu design for `webtechnosys-ai-agency-e5da22` only. No HotelRadar or WhatsApp changes. This is UI navigation, not a knowledge publication or connector action.

## Delivered behaviour

- Our AI Services, AI Training & Booking, AI Film Making, Explore AI Bot Demos, Contact Our Team.
- Back follows the menu path; Main menu returns to the initial options.
- Ask a question closes the menu and focuses the existing composer. Sending a message also closes the menu. Returning to Main menu preserves messages and visitor session.
- Eight category demo links, individual copy-link buttons, explicit fictional-data/mock-connector notice.
- External website and demo destinations open in a separate tab, leaving the original bot available. Telephone/email links use the visitor's installed handlers.
- Fixed allowlisted destinations; no generated URLs. Training uses `/training-booking/`, never `/booking-engine/`.
- Opening a link does not claim a confirmed booking or a submitted callback.
- Keyboard focus and text labels accompany icons; the menu scrolls inside the existing transcript region.

## Evidence

- Five navigation contract tests passed; TypeScript passed.
- All eight demo destinations responded HTTP 200.
- Deployment succeeded at 2026-09-06T02:51:09.108Z. Rollback backup: `/var/backups/aifrogi/webtechnosys-navigation-20260906.cesHh0`.
- Training and filmmaking destinations responded HTTP 200 on 2026-09-06 before deployment.
- No browser interaction/visual QA performed in this change.
- Release target: `webtechnosys-navigation-20260906`, baseline `customer-actions-20260906`. Deployment gated on build and readiness with previous build/source backup.

This change does not establish a new bot-accuracy score or close any connector acceptance work.
