# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## CI-024 — HotelGPT-first Core regression package

- Status: complete and verified locally; not deployed.
- Scope: 40 universal Core cases plus 20 HotelGPT cases, typo-tolerant hotel intent, explicit correction of stale context, Hindi cross-guest privacy protection, password redaction, and retry/rejection of visibly incomplete long model answers.
- Evidence: regression bank 60/60, TypeScript pass, Sovereign suite pass, production-hardening 126/126, and channel suite 232/232.
- Excluded: tenant knowledge, frontend, credits, TypeSafe, booking/payment authority, and production configuration.
- Deployment requires the user's explicit approval after review of this result.
