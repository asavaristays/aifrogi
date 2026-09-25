# HotelGPT Quick Replies & Guest Updates

Status: implementation specification, 25 September 2026

## Product contract

HotelGPT may understand and route a guest request. Only a hotel team member may commit the hotel to an operational action or mark work complete. The automatic In-Stay acknowledgement confirms receipt only; it never says work started, a department accepted, someone is on the way, the request is complete, or promises a time.

Pre-Stay and In-Stay saved replies are separate libraries. Public Pre-Stay conversations cannot see verified In-Stay operational replies, status controls, rooms, or case metadata. In-Stay replies remain attached to a verified room case and its existing tenant boundary.

## Data and ownership

- AiFrogi provides a versioned master library of useful hospitality defaults.
- A hotel installs independent editable copies into its existing property settings. Master updates never replace tenant copies.
- Each saved reply records journey, department, request category, operational status, approved message, permitted roles, automatic or staff-triggered mode, enabled state, language variants, template identity and version.
- Operational status is recorded on the room-first case. Completion is accepted only through the explicit resolution action.
- Every sent saved reply records actor, timestamp, template identity/version, original approved text, final sent text, request status and department in the existing tenant-scoped audit log.

## Staff experience

The inbox derives at most four relevant actions from the active journey, case status and department. Selecting one opens the exact guest-facing preview; staff may edit it, then must click Send. Replies that imply assignment, travel, delay, escalation or completion are never sent automatically. Completion sends only as part of `Resolve & send`; the feedback prompt is then offered as a separate follow-up.

Owners and admins manage the library at **Settings → Guest communication → Saved replies**. Agents may use enabled replies permitted to their role; viewers cannot send or manage them.

## Guest experience

Human updates render once with a clear sender label such as `Housekeeping · 7:42 PM`, followed by the message. The renderer removes legacy duplicated prefixes such as `Front desk: Front desk update:`. Employee names are not exposed by default. Exact time promises appear only when a staff member deliberately types them into the final preview.

## Explicit non-goals

No PMS integration, automatic journey phase transition, AI-authored operational commitment, complex automation engine, employee-name disclosure, silent tenant activation or cross-journey reuse is included.

## Acceptance path

Verified guest request → truthful receipt-only acknowledgement → staff assignment → contextual saved-reply preview → deliberate send → case timeline/status update → explicit resolution with completion reply → optional feedback prompt. Desktop and mobile Chrome must preserve the same authority and journey boundaries.
