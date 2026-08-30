# AiFrogi Bot Persona and Connector System v1.0

## Purpose

AiFrogi uses one Sovereign Intelligence runtime with versioned category persona packs. A new bot category is configured through a governed pack instead of duplicating onboarding, retrieval, action, handover, and administration code.

## Three configuration layers

1. **Platform persona pack** defines the category identity, default tone, customer journey, authority boundaries, mandatory slots, hard escalations, capabilities, and connector contracts.
2. **Client profile** supplies the business name, approved objectives, languages, safe fallback, prohibited claims, escalation wording, and other tenant-specific overrides.
3. **Connector plan** records provider, lifecycle, permitted reads and writes, unavailable behaviour, and verification status. A planned or configured connector is never represented as live.

The runtime composes these layers with the tenant's approved knowledge. Client configuration cannot remove platform safety boundaries.

## Category packs

| Category code | Product | Primary journey | Connector boundary |
| --- | --- | --- | --- |
| `BUSINESS_AI` | BusinessGPT | Enquiry to qualified lead | CRM or approved lead system |
| `PINGBOOK` | ClinicGPT | Appointment request to verified slot | Calendar and operational sheet/CRM; no medical judgment |
| `STAY` | HotelGPT | Stay enquiry to verified availability or handover | PMS/channel manager; never invent rooms or rates |
| `RESTAURANT` | DineGPT | Menu/reservation enquiry to confirmed outcome | Reservation/POS; never guess allergens |
| `EDUCATION` | eduGPT | Programme enquiry to admissions next step | Admissions/calendar; protect minor records |
| `REAL_ESTATE` | PropertyGPT | Requirement to qualified property/site visit | CRM/calendar; legal/title conclusions require authority |
| `FLOWCART` | FlowCart | Product discovery to approved order action | Commerce/order/payment systems; verify live stock and writes |
| `CUSTOM` | Custom Business Bot | Client-approved journey | Connector contract produced from signed scope |

## Connector lifecycle

`REQUESTED` → `AUTHORISED` → `CONNECTED` → `MAPPED` → `SANDBOX_TESTED` → `VERIFIED` → `LIVE` → `MONITORED`

A connector can be enabled only at `LIVE` or `MONITORED`. Action-mode go-live is blocked unless every required connector is enabled and verified at one of those stages. Read operations may have an approved stale-data disclaimer; write operations fail closed and must not be simulated.

## Responsibility split

- **SuperAdmin:** selects the category, approves authority, configures and verifies connectors, and controls live/pause/delete lifecycle.
- **AI Bot Admin:** maintains approved client knowledge, client-level persona details, conversation operations, flags, and handover.
- **Runtime:** applies persona policy, retrieves tenant-only approved evidence, remembers required slots, invokes only authorised verified tools, and logs decisions.
- **Human team:** handles judgment, exceptions, sensitive cases, and actions outside verified authority.

## Adding a future category

1. Add one typed persona pack with required fields and connector contracts.
2. Map it to an existing category code or introduce a schema migration for a new code.
3. Add deterministic hard boundaries where risk cannot depend on model interpretation.
4. Add category test cases for normal, missing-data, unsafe, connector-failure, and handover paths.
5. Run the common Sovereign Intelligence suite and category suite before enabling trials.

## Go-live evidence

- Client profile and category pack version recorded.
- Approved knowledge present and tenant-isolated.
- Mandatory slots, hard escalations, and action approval tested.
- Required connector reads and writes tested with idempotency where applicable.
- Unavailable connector behaviour demonstrated.
- Preview answers and client sign-off recorded.
- Human handover path verified.
- Monitoring and pause controls operational.

This design provides reusable engineering, not automatic proof that every provider integration is complete. Each provider adapter and client credential set still requires implementation, testing, approval, and monitoring before the connector becomes live.
