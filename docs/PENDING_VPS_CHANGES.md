# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## CI-023 — Core answer-path recovery

- Status: locally implemented and verified; not deployed.
- Scope: shared context priority, explicit-entity deep context, current-question operation slots, numeric-equivalence validation, unsupported entitlement blocking, and answer replay trace.
- Tenant knowledge, frontend, TypeSafe configuration, credits and production data are unchanged.
- Local evidence: focused tests 10/10, TypeScript pass, Sovereign 381/381, channels 232/232, production-hardening 126/126 and the 91-page webpack production build.
- Production-derived evidence: TypeScript and the complete 89-route build passed; Core passed 30/30 and fresh Golden certification passed for Asavaristays, Castle Mandawa and Webtechnosys (3/3).
- Exact-answer replay result: rate retrieval, Coorg context, general online booking without inherited destination, cancellation retrieval and payment-verification boundary worked. Parking still incorrectly said self-parking was “included as a property amenity” without explicit no-charge evidence. Deployment is blocked; do not run promotion until the user approves a narrow entitlement-validation correction, repeat replay passes, the security gate passes, and the user separately approves deployment.
