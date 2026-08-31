# Section 02: Inbox And Human Operations

Status: Implemented; awaiting product-owner acceptance
Target score: 8.5/10

## Think

Primary user: a business owner, sales operator, support agent, or HotelRADAR/AiFrogi admin handling live WhatsApp conversations.

Primary job: know who needs attention, understand what AI already knows, reply safely, hand over to a human when needed, and keep every lead moving without exposing Meta complexity.

Reference input: a high-volume customer-service console with queue filters, conversation list, chat center, action menus, and a customer context rail.

What we should borrow:

- Persistent queue filters.
- Three-pane working model.
- Clear active conversation state.
- Contact context on the right.
- Quick operating commands like assign, resolve, export, mark unread, and block.

What we should not copy:

- Too many icons without meaning for a small business user.
- Dense support-agent language that feels like enterprise helpdesk software.
- Scattered dropdown actions that hide important WhatsApp constraints.
- Generic customer-service vocabulary that ignores campaigns, AI audit, trial leads, Meta template windows, and automation.

## Rethink

AiFrogi Inbox should become an AI operating desk, not just a WhatsApp chat screen.

The first version should have five clear surfaces:

1. Product rail
   - Today
   - Inbox
   - Contacts
   - Campaigns
   - Workflows
   - Analytics
   - Setup
   - Support

2. Queue column
   - All
   - Waiting reply
   - Not replied
   - AI replied
   - Human needed
   - Campaign replies
   - Trial leads
   - Audit leads
   - Resolved
   - Failed delivery

3. Conversation list
   - Contact name and phone.
   - Last message preview.
   - Time since last activity.
   - Source: website, broadcast, audit, trial, manual, inbound.
   - Status: waiting, answered, AI replied, human needed, template required.
   - Assignment: owner initials or unassigned.
   - Priority marker for high-intent or stalled leads.

4. Chat workspace
   - WhatsApp conversation.
   - AI suggested reply with confidence.
   - Human reply box.
   - Approved template mode when the 24-hour reply window is closed.
   - Quick replies for audit, trial, pricing, callback, website review, and opt-out.
   - Internal note tab.
   - Resolve, assign, human takeover, create ticket, and send template actions.

5. Lead intelligence rail
   - Contact profile.
   - Intent and source.
   - Campaign/template that created the reply.
   - AI summary.
   - Recommended next action.
   - Audit/trial readiness checklist.
   - Automation status.
   - Delivery health.
   - Timeline.
   - Tags and notes.

## Product Inputs

The Inbox must support both current AiFrogi use cases:

- Client use: send and receive WhatsApp API messages, reply to inbound leads, use approved templates, and manage customer conversations.
- Super-admin use: monitor client workspaces, diagnose API status, support onboarding, and demonstrate automation capability.

The Inbox must make these states obvious:

- Free-text reply is allowed because the customer replied within the service window.
- Free-text reply is blocked and an approved Meta template is required.
- AI has replied, but human review is recommended.
- Broadcast generated a reply.
- Delivery failed due to payment, template, engagement limit, or recipient availability.
- A conversation was moved to human follow-up.
- A lead came from AI audit, 15-day trial, website assistant, campaign, or manual test.

## Visual Direction

The UI should feel calm, structured, and operational:

- Use the same simple typography as the revised `Today` section.
- Keep button sizes professional, not oversized.
- Use color only for meaning:
  - Green: ready, connected, resolved.
  - Amber: waiting, needs review.
  - Red: failed or blocked.
  - Blue: AI suggestion or information.
  - Dark rail: system-level controls.
- Avoid heavy uppercase labels except small technical chips where needed.
- Keep the center chat readable and spacious.
- Make the right rail informative, not decorative.
- On mobile, collapse into:
  1. Queue
  2. Chat
  3. Lead profile
  with clear back navigation.

## Implementation Plan

Phase 1: Structure

- Refactor the Inbox into reusable panes:
  - `InboxQueue`
  - `ConversationList`
  - `ConversationWorkspace`
  - `LeadIntelligenceRail`
  - `InboxActionBar`
- Preserve existing send, template, AI mode, and lead-profile logic.
- Replace the current scattered layout with a stable desktop grid.

Phase 2: Intelligence

- Add queue buckets derived from existing lead/message data.
- Add source chips for audit, trial, website bot, campaign, and manual.
- Add AI confidence and recommended next action.
- Add clearer 24-hour window/template-required messaging.

Phase 3: Operations

- Add assign, resolve, human takeover, create support ticket, and internal notes as first-class controls.
- Add delivery failure explanations in plain language.
- Add campaign reply grouping.

Phase 4: Admin Readiness

- Show integration health and message delivery state in the rail.
- Support super-admin customer context later without mixing it into the client operator view.

## Acceptance Gates

- A user can identify the most urgent conversation within three seconds.
- Waiting, AI replied, human needed, template required, resolved, and failed states are visually distinct.
- A user can reply, send an approved template, add a note, assign, and resolve without opening a hidden menu.
- The right rail explains why the lead matters and what should happen next.
- Meta/API constraints are explained as user-facing impact, not technical errors.
- Existing WhatsApp sending behavior remains intact.
- Existing template sending behavior remains intact.
- Existing human follow-up behavior remains intact.
- No horizontal overflow at 390px, 768px, 1024px, and 1440px.
- Typecheck, lint, and production build pass.
- Production PM2 remains healthy after deployment.
- Product-owner rating is at least 8.5/10 before Section 03 begins.

## Implemented

- Rebuilt Inbox into a four-surface operations desk:
  - Queue column.
  - Conversation list.
  - Chat workspace.
  - Lead intelligence rail.
- Added queue classification for:
  - All.
  - Waiting reply.
  - Not replied.
  - AI replied.
  - Human needed.
  - Campaign replies.
  - Trial leads.
  - Audit leads.
  - Resolved.
  - Failed delivery.
- Added source chips for AI audit, trial, campaign, website, inbound, and manual context.
- Added conversation state chips for waiting reply, template required, AI replied, human needed, resolved, and failed delivery.
- Added AI suggested reply panel with one-click insertion into the reply composer.
- Added quick reply chips for audit intake, trial intake, callback booking, and opt-out.
- Kept existing operator message send behavior.
- Kept existing approved-template compose behavior.
- Kept existing bulk send behavior.
- Kept existing asset share behavior.
- Kept existing human takeover behavior.
- Added right-side recommended next action language that explains WhatsApp service-window impact in plain English.
- Added local-only `/preview/inbox` QA route with audit, trial, template-required, failed-delivery, and human-needed mock states.
- Added mobile jump navigation for Queues, Chats, Reply, and Profile.

## Test Evidence

- TypeScript typecheck: passed.
- ESLint: passed with no new warnings; existing repository warnings remain.
- Production build: passed locally.
- Desktop preview at 1265px: no horizontal overflow; queue column, conversation list, chat workspace, and lead intelligence rail visible.
- Mobile preview at 390px: no horizontal overflow; jump navigation visible and queues/profile/chat content reachable.
- Existing send/template/bulk/asset/human-takeover function bodies were preserved while the visible layout was refactored.
- Visual polish revision: softer deep-teal rail, calmer conversation list, warmer chat workspace, rounder controls, clearer mobile jump bar, and stronger New Message action styling.

## Not In This Section

- Full CRM pipeline redesign.
- Billing/wallet redesign.
- Super-admin customer command center redesign.
- New Meta template approval workflow.
- Fully autonomous AI agent behavior.

These should follow after the Inbox becomes excellent.
