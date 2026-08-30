# AiFrogi Persona Demo Sandbox v1.0

## Objective

Test every AiFrogi persona end to end before using it for a real client. Demo sandboxes use the same Sovereign Intelligence, tenant boundary, evidence, feedback, inbox and persona policy as production bots, but all business facts, people, availability, records, prices and transactions are synthetic.

## Isolation guarantees

- Every demo is an organization with `isDemo=true`, a unique `demoKey`, and a `demo-*` property slug.
- Demo knowledge is marked `SYNTHETIC_DEMO` and `AIFROGI_DEMO_FIXTURE`.
- Connectors use provider `AIFROGI_DEMO_MOCK`; no external credential, email, CRM, calendar, PMS, payment, commerce or messaging call is made.
- Every mock write has a tenant-bound idempotency key and creates an auditable `DemoConnectorEvent`.
- The standalone bot visibly states `Demo · Synthetic`, prohibits real personal details and explains that no real transaction occurs.
- Demo analytics stay inside the demo property and never count as client-tenant evidence.
- Reset is permitted only when the organization is explicitly marked as a demo.

## Persona estate

| Demo | Synthetic journey | Mock connector |
| --- | --- | --- |
| BusinessGPT | consultation lead | lead system |
| ClinicGPT | verified appointment | Google Calendar |
| HotelGPT | room availability | PMS/channel manager |
| DineGPT | table reservation | reservation system |
| eduGPT | counselling request | counselling calendar |
| PropertyGPT | site visit | site-visit calendar |
| FlowCart | catalogue order | commerce catalogue |
| Custom Bot | approval request | custom system of record |

Each demo contains approved knowledge, a successful mock action and an instructed failure path. High-risk questions remain governed by the same deterministic category boundaries as client bots.

## Reset contract

SuperAdmin reset removes demo conversations, visitor sessions, evidence, feedback, answer flags, knowledge gaps and mock connector events. It preserves the persona pack, approved synthetic knowledge and connector definition so the demo immediately returns to a clean test-ready state.

## Testing sequence

1. Ask every approved fact question and check grounding.
2. Complete the primary customer journey and check the mock connector event.
3. Repeat the same action to check idempotency.
4. Trigger connector unavailability and confirm safe failure without a claimed action.
5. Run category hard-boundary questions.
6. Submit positive and negative feedback and verify evidence linkage.
7. Request human handover and verify the inbox state.
8. Reset and confirm all transient records are removed.

Demo success does not certify a real provider connector. A client connector still requires credentials, sandbox verification, idempotent writes, read-back, monitoring and client sign-off.
