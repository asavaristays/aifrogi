# HotelGPT Flow Intelligence architecture

Status: approved product direction, 25 September 2026

## Purpose

HotelGPT uses three layers of intelligence. Core Intelligence is the shared safety and reasoning foundation. Bot Intelligence contains hotel-approved knowledge and operating boundaries. Flow Intelligence turns a recognised guest intent into a short, visible journey with a useful outcome.

Flow Intelligence is an accelerator, not a rigid script engine. It asks one question at a time, reuses facts already known, provides a human exit and never invents availability, rates, bookings, payments or operational completion.

## Permanent journey boundary

| Journey | Access | Knowledge and authority | Default outcome |
| --- | --- | --- | --- |
| Pre-Stay Engagement | Public website and standalone bot | Public approved hotel facts, policies, discovery content and verified booking links | Answer, discovery, enquiry or reservations handover |
| In-Stay Service | Approved room/stay capability only | Stay guidance and human-first hotel operations | Department request, complaint, resolution and feedback |

Pre-Stay and In-Stay retain separate sessions, menus, histories, queues and storage namespaces. Public visitors never receive room information or access to resident operations. In-Stay access ends at checkout or revocation.

## Default HotelGPT library

### Pre-Stay Engagement

1. **Discover hotel** — approved introduction, highlights and relevant next choices.
2. **Find a stay** — destination/property, dates and occupancy; verified availability or booking link only.
3. **Plan arrival** — check-in, transport, directions and early-arrival guidance.

### In-Stay Service

1. **Request hotel service** — room-aware request routed to Front Desk, Housekeeping, Food & Beverage, Maintenance or Experiences.
2. **Report a problem** — issue, urgency and optional detail; immediate human-first acknowledgement.
3. **Resolution and feedback** — visible Received → Acknowledged → In progress → Resolved → Feedback journey.

## Template operating model

Super Admin owns a versioned, read-only category template library. Each hotel receives an independent draft copy. The hotel owner can preview, adapt and publish that copy. Publishing affects only that hotel. A later master-template version is offered as an optional upgrade and never silently replaces a hotel’s live flow.

Every template records its bot category, journey, access boundary, template version, required knowledge, optional connector, department and supported smart outputs. The advanced node canvas remains available, while normal hotel users receive a simpler recommended-flow screen.

## Smart content contract

Flow output may contain conversational text plus structured presentation hints:

- contextual quick replies;
- hotel, stay, experience or comparison cards;
- approved booking action;
- arrival summary;
- department, room and SLA status;
- request-resolution timeline;
- feedback prompt;
- human-handover summary.

The channel chooses the visual presentation. Text remains the safe fallback. Structured output never grants authority beyond the underlying approved knowledge, verified connector or human team.

## Safety and publication rules

- Core safety, privacy and human intent always outrank a flow.
- Only owner-approved hotel copies can be published.
- Every flow has bounded clarification and a human exit.
- Known room, stay, property, dates or occupancy are not requested again.
- Transactional steps require a verified system of record; otherwise the flow answers, links or hands over.
- In-Stay templates cannot be published into the public Pre-Stay menu.
- Existing flows remain backward compatible and are not migrated automatically.

## Rollout

1. Ship the Super Admin HotelGPT library and six versioned templates.
2. Allow a HotelGPT owner to install independent drafts.
3. Preview and publish the correct journey only.
4. Pilot with one hotel and verify public Pre-Stay plus restricted In-Stay behavior.
5. Offer the approved version to all HotelGPT workspaces.
6. Reuse the framework for other bot categories after HotelGPT evidence is complete.
