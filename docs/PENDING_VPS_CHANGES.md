# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## CI-023 — Core answer-path recovery

- Status: locally implemented and verified; not deployed.
- Scope: shared context priority, explicit-entity deep context, current-question operation slots, numeric-equivalence validation, unsupported entitlement blocking, and answer replay trace.
- Tenant knowledge, frontend, TypeSafe configuration, credits and production data are unchanged.
- Local evidence: focused tests 10/10, TypeScript pass, Sovereign 381/381, channels 232/232, production-hardening 126/126 and the 91-page webpack production build.
- Before deployment: run the production-derived build, security gate, and fresh Golden certification for Asavaristays, Castle Mandawa and Webtechnosys; obtain user approval to deploy.
