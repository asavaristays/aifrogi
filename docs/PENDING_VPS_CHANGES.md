# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## CI-023 — Core answer-path recovery

- Status: locally implemented and verified; not deployed.
- Scope: shared context priority, explicit-entity deep context, current-question operation slots, numeric-equivalence validation, unsupported entitlement blocking, and answer replay trace.
- Tenant knowledge, frontend, TypeSafe configuration, credits and production data are unchanged.
- Local evidence: focused tests 10/10, TypeScript pass, Sovereign 381/381, channels 232/232, production-hardening 126/126 and the 91-page webpack production build.
- Production-derived evidence: TypeScript and the complete 89-route build passed; Core passed 30/30 and fresh Golden certification passed for Asavaristays, Castle Mandawa and Webtechnosys (3/3).
- Remaining before deployment: the Golden format checks dispositions but does not retain answer text, and Asavaristays' bank omits the four observed failure topics. Replay the same ten Asavaristays questions against the isolated candidate with answer-text review, run the security gate, and obtain explicit user approval to deploy.
