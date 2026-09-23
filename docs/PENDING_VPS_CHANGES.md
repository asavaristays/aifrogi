# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## CI-026 — Tenant property-ID answer isolation

- Status: complete and verified locally; not deployed.
- Scope: the shared HotelGPT frame now resolves tenant → stable property ID → property-scoped evidence before composition. It blocks cross-property sources, keeps explicit property corrections out of stale rate negotiation context, answers bedrooms/bathrooms in multipart facts, preserves exact landmark requests, refuses previous-guest data requests, and prevents incomplete published fallbacks.
- Evidence: focused 17/17, Sovereign 391/391, production-hardening 94/94, channels 231/231, TypeScript and the 91-route Webpack production build pass.
- Excluded: tenant knowledge changes, TypeSafe, frontend, credits, connector authority and deployment.
- Deployment requires separate explicit user approval after local review.
