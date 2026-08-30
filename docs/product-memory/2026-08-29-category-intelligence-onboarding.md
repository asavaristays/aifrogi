# AiFrogi Category Intelligence and SuperAdmin Onboarding

Last updated: 29 August 2026  
Authority: AiFrogi SuperAdmin (`info@aifrogi.com`)  
Related memory: `docs/product-memory/2026-08-29-ai-business-bot.md`

## Locked decision

AiFrogi bot onboarding is operated by SuperAdmin. The client supplies and approves business truth, but cannot independently change its bot category, channels, authority, tools, or go-live blueprint.

This protects the Sovereign Business Bot promise:

- AiFrogi controls technical provisioning and safety.
- The client owns and approves business intelligence.
- Every category has a defined knowledge schema, authority model, evaluation pack, and verified outcomes.
- Website and WhatsApp remain channels for the same bot, not separate intelligence products.

## Category portfolio

| Internal category | Product name | Primary outcome |
|---|---|---|
| `STAY` | HotelGPT | Direct booking, guest assistance, upsell, and hotel revenue |
| `PINGBOOK` | ClinicGPT | Verified appointment confirmation |
| `RESTAURANT` | DineGPT | Verified reservation, order, catering, or event enquiry |
| `REAL_ESTATE` | PropertyGPT | Qualified buyer and verified site visit |
| `EDUCATION` | eduGPT | Qualified admission or counselling enquiry |
| `BUSINESS_AI` | BusinessGPT | Qualified business lead and approved human or commercial action |
| `FLOWCART` | FlowCart | Verified cart, order, and payment journey |
| `CUSTOM` | Custom Business Bot | Explicitly designed and governed business workflow |

HotelGPT is the flagship revenue category. ClinicGPT remains the cleanest first proof of verified agentic action.

## SuperAdmin flow

1. Create or select the client organization.
2. Select the bot category.
3. Select Website, WhatsApp, or both.
4. Select operating mode and approved capabilities.
5. Load the category intelligence blueprint.
6. Collect category-specific business inputs.
7. Acquire internal and approved external knowledge.
8. Detect missing facts, conflicts, duplication, and expiry.
9. Obtain client approval for business truth.
10. Configure tools, authority, human handoff, and outcomes.
11. Run the category evaluation pack.
12. Activate a controlled pilot.
13. Verify the first business outcome.
14. Approve production go-live.

Every onboarding also captures the business logo, approved photos, Google Maps location, Google Business Profile when available, social presence, address, contact routes, and usage rights for supplied media.

## Client responsibilities

- Confirm business identity and ownership.
- Supply accurate operational documents and system access through approved connection flows.
- Review extracted intelligence.
- Resolve conflicts and knowledge gaps.
- Approve customer-facing facts, policies, prices, and operating instructions.
- Approve tools, action authority, and escalation contacts.
- Approve the final published intelligence version.

## Intelligence lifecycle

`Discovered → Extracted → Classified → Draft → Conflict review → Client approved → Published → Evaluated → Active → Superseded or expired`

Only approved and published intelligence may support business-specific claims or actions.

Every knowledge item should retain:

- Tenant and business owner
- Category and subcategory
- Source type: internal or external
- Source name and location
- Extracted content and structured facts
- Approval identity and timestamp
- Effective and expiry dates
- Refresh frequency
- Reliability level
- Citation permission
- Action-authority relevance
- Version and superseded version

## Internal and external knowledge rules

Internal sources are the authority for business identity, product truth, prices, availability, policies, processes, staff authority, customer qualification, and escalation.

External sources may enrich the answer only when approved. Each external source requires an owner, reliability classification, refresh schedule, approval status, and expiry policy. External content must not override approved internal business truth.

## HotelGPT

Required internal intelligence:

- Property identity, Google Maps location, Google Business Profile, logo, and positioning
- Approved property, room, dining, experience, event, and team photos
- Rooms, occupancy, amenities, inclusions, and exclusions
- Rates, packages, and approved offer rules
- Availability and direct-booking benefits
- Check-in, checkout, cancellation, refund, child, visitor, pet, and smoking policies
- Dining, experiences, spa, transfers, weddings, groups, and corporate business
- Deposits, payments, escalation contacts, and operating hours

Approved external intelligence:

- Official hotel website
- Approved OTA listing content
- Google Business Profile
- Official destination, airport, transport, weather, and travel-advisory sources

Tools and systems:

- PMS, booking engine, channel manager, CRM, payment provider, guest-service, restaurant, and spa systems

Live availability is a connector capability, not a language-model capability. HotelGPT may describe availability as live only after a PMS, channel-manager, or booking-engine connector passes authentication, sandbox mapping, duplicate and timeout tests, live-read verification, and monitoring. Until then it must capture an enquiry or hand off to reservations.

PMS/channel-manager API access is tracked as an external dependency: `Requested → Provider review → Credentials pending → Sandbox → Connected → Verified → Monitored`. Credentials use protected secret storage and never enter documentation.

Critical rules:

- Hotel-approved truth overrides OTA content.
- Never invent price, availability, policy, facility, or offer.
- Never confirm a booking until it is created idempotently and read back from the system of record.

Verified outcomes include availability presented, direct-booking opportunity, booking confirmed, deposit received, reservations handoff, and upsell accepted.

## Governed negotiation layer

Negotiation is a policy-controlled tool layer, not free-form persuasion. SuperAdmin defines the allowed range, preferred alternatives, approval threshold, expiry, escalation owner, and prohibited claims.

Every negotiation records the customer request, original value, offered value or value-add, approved rule, bot authority or human approval, expiry, customer response, and final verified outcome.

HotelGPT may use approved rate fences, packages, upgrades, inclusions, and value-adds. It must never undercut a floor rate, invent a discount, override inventory, or grant an exception outside its authority. Group, wedding, long-stay, corporate, and exceptional requests escalate to the hotel team.

## ClinicGPT

Required internal intelligence:

- Services, practitioners, locations, duration, pricing, deposits, working hours, availability, preparation, cancellation, eligibility, and escalation

Approved external intelligence should be deliberately narrow. Medical or wellness bots must not convert general internet health content into business truth.

Tools include calendar or appointment system, CRM, payment provider, and reminders.

`AppointmentConfirmed` requires explicit customer confirmation, idempotent creation, system read-back, matching customer/service/time/location, and stored evidence.

## DineGPT

Required internal intelligence:

- Menus, modifiers, prices, taxes, opening hours, table capacity, reservations, delivery areas, dietary and allergen facts, offers, events, catering, deposits, and cancellations

Approved external sources include official maps, food-safety sources, approved delivery information, and client-approved local-event information.

Tools include POS, reservation platform, kitchen/order system, delivery provider, and payments.

Incomplete allergen information always escalates. Menu availability, reservations, and orders must be verified.

## PropertyGPT

Required internal intelligence:

- Projects, inventory, location, configuration, area, price, availability, amenities, possession status, developer information, payment schedules, buyer qualification, site visits, and sales routing

Approved external sources include official regulatory records, government infrastructure sources, approved maps, neighbourhood data, and approved mortgage sources.

The bot must never invent appreciation, returns, legal conclusions, regulatory status, price, or availability.

Verified outcomes include buyer qualified, matching property presented, brochure shared, site visit confirmed, sales agent assigned, and booking interest created.

## BusinessGPT

Required intelligence includes services, ideal customers, locations, pricing guidance, delivery process, case studies, qualification questions, commercial boundaries, support, and escalation.

Approved actions include lead capture, qualification, callback, consultation booking, approved material sharing, quote request, and specialist escalation.

## FlowCart

Required intelligence includes catalog, variants, price, tax, inventory, delivery, returns, offers, fulfilment, and order support.

Tools include catalog, inventory, order management, payments, delivery, and CRM.

Orders and payments require idempotency and read-back verification. Refunds and exceptional discounts require explicit authority.

## Custom Business Bot

A custom bot cannot go live until SuperAdmin records:

- Business objective
- Users and channels
- Knowledge domains
- Systems of record
- Allowed actions
- Approval boundaries
- Human escalation
- Verified outcomes
- Evaluation suite
- Rollback procedure

## Category evaluation gate

All bots require:

- Approved factual-answer accuracy
- Unknown-answer escalation
- Tenant isolation
- Permission enforcement
- Duplicate-action protection
- Human handoff
- Outcome evidence
- Rollback validation

Additional category evaluations:

- HotelGPT: room, rate, policy, availability, booking idempotency, and booking read-back
- ClinicGPT: availability, slot collision, appointment idempotency, read-back, and safety escalation
- DineGPT: menu, price, allergen safety, reservation collision, and order verification
- PropertyGPT: inventory, price, regulatory claims, suitability matching, site visit, and routing
- FlowCart: catalog, inventory, pricing, order creation, payment verification, and returns

## Implementation rule

The category blueprint is product configuration, not merely UI copy. Future onboarding forms, knowledge schemas, tools, evaluations, reports, and outcomes must derive from the selected blueprint. Do not implement separate disconnected logic for each channel.
