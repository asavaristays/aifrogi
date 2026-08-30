# AiFrogi AI Bot Hero and Mock-up System

Last updated: 30 August 2026  
Status: Canonical implementation specification

## Purpose

Every dedicated AiFrogi AI Bot page must immediately show what the product does. The hero is not a decorative mascot or a generic chat screen. It is a compact, credible business journey that connects customer intent to trusted intelligence, an approved action, a verified outcome, and accountable human operations.

ClinicGPT established the approved visual pattern. All bot categories now use the same black-and-antique-gold phone stage and responsive composition, while the conversation, choices, evidence and outcome change by category.

## Locked visual system

- Background: pure black, integrated with the supplied black-and-gold phone artwork.
- Primary accent: Dark Antique Gold `#8A6A16`.
- Supporting gold: Champagne Gold `#E2C66D` and Pale Gold `#F3E5B5`.
- Primary text: white.
- Verified state: restrained confirmation green.
- Desktop: 1600 × 800 stage, product narrative on the left and full phone journey on the right.
- Mobile: separate copy block followed by a centred, full-height phone presentation. Never scale the full desktop composition into a tiny mobile image.
- Static journey: the complete story is readable without waiting, hovering or triggering animation.
- Typography: customer and assistant messages must remain readable at the actual rendered phone size. Do not compress the journey to force extra content.
- Boundaries: the UI overlay must remain inside the physical phone screen at every breakpoint.

## Shared information hierarchy

Each phone mock-up contains these states in this order:

1. Product identity and operating status
2. Customer intent
3. Bot qualification or safety question
4. Customer answer
5. Approved options from business intelligence or a connected system
6. Explicit customer selection or confirmation
7. Verified primary outcome with reference evidence
8. Two operational follow-ups
9. Provenance or system-of-record statement

The left hero narrative contains:

- Category and Sovereign Business Bot positioning
- Product name
- Outcome-led headline
- Short product explanation
- Rotating summary of customer intent, trusted intelligence, approved action and verified outcome
- One onboarding action

## Product mock-up stories

### BusinessGPT

- Intent: automate customer enquiries and follow-up
- Qualification: identify the first customer channels
- Approved choice: qualify demand before automation expansion
- Verified outcome: qualified automation lead and consultation request
- Operational evidence: brief recorded and specialist notified

### HotelGPT

- Intent: two-adult stay with sea-view preference
- Intelligence: connected availability and approved rate rules
- Approved options: room categories available for the requested dates
- Verified outcome: availability verified and direct-booking opportunity prepared
- Operational evidence: booking link ready and reservations notified
- Safety rule: the mock-up may state that availability is verified only because it explicitly represents a connected hotel system of record. Without a verified PMS, channel manager or booking engine, production HotelGPT must capture an enquiry or hand off.

### ClinicGPT

- Intent: dental appointment on Friday afternoon
- Qualification: mobile number for clinic confirmation
- Approved options: valid appointment slots
- Verified outcome: `AppointmentConfirmed` with date, time and reference
- Operational evidence: reminder set and clinic notified

### DineGPT

- Intent: table for four on Saturday evening
- Safety qualification: dietary and allergen requirements
- Approved options: table availability
- Verified outcome: reservation verified
- Operational evidence: dietary note saved and restaurant notified

### eduGPT

- Intent: Class 11 science coaching starting next month
- Qualification: board, learning mode, and subject combination
- Approved options: published programme or batch choices
- Verified outcome: admission enquiry qualified with reference
- Operational evidence: programme matched and admissions team notified

### PropertyGPT

- Intent: two-bedroom North Goa home within budget
- Qualification: own use, investment or future possession
- Approved options: matching approved inventory locations
- Verified outcome: site visit requested with reference
- Operational evidence: buyer qualified and advisor assigned

### FlowCart

- Intent: configured birthday-cake order
- Qualification: size, delivery window and personalization
- Approved options: valid delivery slots
- Verified outcome: order created with total and payment step
- Operational evidence: stock verified and store notified

### Custom Business Bot

- Intent: business-specific operational request
- Qualification: urgency and operating impact
- Approved options: configured response paths
- Verified outcome: governed service task created
- Operational evidence: responsible resource routed and manager notified

## Implementation source of truth

- Shared hero layout: `components/marketing/ai-product-hero.tsx`
- Product-specific phone journeys: `components/marketing/animated-bot-phone.tsx`
- Generic product metadata and page content: `lib/bot-products.ts`
- Backend category authority: `lib/bot-blueprints.ts`
- Category onboarding and intelligence rules: `docs/product-memory/2026-08-29-category-intelligence-onboarding.md`

The mock-up story must agree with the backend blueprint. It must never claim an action, connector, live availability, safety assurance or verified outcome that the corresponding category cannot support under its configured authority.

## Change rules

When upgrading a hero:

1. Update the product blueprint or product content first if the business outcome changed.
2. Keep the nine-state story hierarchy.
3. Use customer language, not architecture jargon.
4. Show only one primary outcome.
5. Keep proof and human handover visible.
6. Check desktop and a 390 × 844 mobile viewport.
7. Verify that legacy navigation and canonical URLs still resolve.
8. Run typecheck, channel tests, lint and production build.

Do not add independent hero implementations for individual customers. Customer-specific facts belong in governed knowledge and configuration, not in the shared marketing component.
