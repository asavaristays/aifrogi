# Pending VPS changes

This file contains only changes that are complete locally but not yet deployed to the VPS.

## HotelGPT Flow Intelligence foundation (2026-09-25)

Complete locally and awaiting explicit deployment approval. The candidate adds a versioned Super Admin HotelGPT flow library, six default hospitality journeys split into three public Pre-Stay flows and three verified In-Stay flows, independent hotel-owned draft installation, publish-time journey safeguards, runtime intent matching and structured status/quick-reply output. Existing tenants and published flows are not modified automatically. In-Stay templates cannot be exposed through the public Pre-Stay menu, and no PMS dependency, automatic phase transition or database migration is introduced.

The agreed design is recorded in `docs/HOTELGPT_FLOW_INTELLIGENCE_ARCHITECTURE.md`. Local validation passed TypeScript, scoped ESLint with no errors, 256/256 channel tests and the complete 94-route Webpack production build. Deployment and live Chrome verification remain pending and require a separate explicit approval.
