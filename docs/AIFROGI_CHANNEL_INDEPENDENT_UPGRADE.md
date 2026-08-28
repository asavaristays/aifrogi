# AiFrogi Channel-Independent Upgrade

Status: Phase 1 implemented, backend first  
Strategy: additive modular-monolith migration with feature flags  
Production rule: the existing WhatsApp path remains the default until parity gates pass

## Objective

AiFrogi will become a channel-independent intelligent business bot platform. WhatsApp remains a supported connector, while website chat and future channels share the same customer, conversation, intelligence, handover, and outcome services.

The operating loop is:

`understand -> retrieve -> plan -> authorize -> execute -> verify -> respond -> observe`

## Current architecture

- Next.js App Router provides the public site, authenticated console, and API routes.
- Prisma with PostgreSQL stores organizations, properties, members, leads, messages, campaigns, knowledge, billing, automation, appointment, and commerce data.
- `Organization` is the current tenant boundary. `Property` is the current workspace boundary.
- Authentication uses signed sessions, organization membership, workspace roles, optional HotelRadar SSO, and privileged OTP.
- WhatsApp Cloud API and Twilio ingress are handled by `app/api/integrations/whatsapp/webhook/route.ts` and `lib/services/whatsapp-service.ts`.
- `Lead` and `LeadMessage` are the current customer/conversation compatibility records.
- AI behavior currently consists of approved-knowledge answers, deterministic auto-replies, workflow rules, and operational intelligence summaries. There is no durable agent-run or tool-call trace yet.
- Campaigns are a separate outreach domain and must remain separate from a customer conversation.
- Automation jobs already provide idempotency, retry, lease, and dead-letter concepts that can be reused.
- Deployment currently uses PM2 and Nginx. Production source and GitHub must be reconciled before database deployment.

## Technical debt and migration risks

1. WhatsApp concepts are embedded in service, route, UI, and schema names.
2. `Lead` combines customer identity, qualification, and conversation concerns.
3. There is no neutral channel registry, connection record, participant identity, or conversation record.
4. AI output is not linked to a durable agent run, source set, confidence score, tool call, or verified outcome.
5. Verification scripts exist, but the repository lacks a focused contract-test suite for channel routing and tenant isolation.
6. Production has historically been deployed from a non-Git checkout, creating source-of-truth drift.
7. A direct rename of current models or environment variables would break production integrations.

## Target architecture

The target remains one Next.js modular monolith:

1. Channel adapters normalize inbound events and implement outbound policy and delivery behavior.
2. A central conversation service owns participants, conversations, messages, ordering, ownership, and channel metadata.
3. An agent orchestrator owns intent, retrieval, planning, confidence, escalation, and verified responses.
4. Vertical packs configure knowledge, policies, tools, and outcomes for Stay, PingBook, and FlowCart.
5. A tool registry owns schemas, permissions, idempotency, execution, read-back verification, and failure handling.
6. Operations services own human takeover, trace visibility, integration health, audits, and evidence-backed outcomes.

No microservice split is planned until measured load or isolation requirements justify it.

## Proposed domain model

Phase 1 adds these neutral records alongside legacy records:

- `ChannelConnection`: workspace-owned connector configuration and status.
- `Participant`: workspace-owned customer, human, bot, or system identity.
- `Conversation`: channel-neutral thread, status, ownership, and bot-pause state.
- `ConversationParticipant`: role-aware membership in a conversation.
- `Message`: normalized inbound/outbound/system content and provider identifiers.

Compatibility links connect `Conversation` to `Lead` and `Message` to `LeadMessage` without renaming or deleting legacy fields.

Phase 2 adds `AgentRun`, `AgentStep`, `ToolCall`, `Escalation`, `Outcome`, and neutral `AuditEvent` records.

## Channel contract

Every adapter implements:

- `receiveInboundEvent`
- `normalizeParticipant`
- `normalizeMessage`
- `sendMessage`
- `sendStructuredMessage`
- `getSessionState`
- `validateOutboundPolicy`
- `mapDeliveryStatus`
- `handleChannelError`

The WhatsApp adapter is the first implementation and delegates to the existing WhatsApp service. The production webhook remains unchanged until the shadow path and parity tests pass.

## API changes

Phase 1 introduces internal services only. Existing public APIs remain unchanged.

Later APIs will be versioned under `/api/v1`:

- `/api/v1/conversations`
- `/api/v1/conversations/:id/messages`
- `/api/v1/conversations/:id/ownership`
- `/api/v1/channels`
- `/api/v1/channels/:id/health`
- `/api/v1/escalations`
- `/api/v1/outcomes`

Old WhatsApp APIs continue to work and can call the neutral services behind feature flags.

## Database migration sequence

1. Add enums and neutral Phase 1 tables.
2. Add nullable compatibility references to existing leads/messages.
3. Deploy with `AIFROGI_CHANNEL_CORE_ENABLED=false`.
4. Shadow-write new conversations/messages after the authoritative legacy write.
5. Compare legacy and neutral counts, ordering, provider IDs, and tenant ownership.
6. Enable neutral reads for internal workspaces.
7. Enable selected pilots.
8. Keep legacy records and rollback mappings until post-pilot acceptance.

All changes are additive. Production data is never reset, renamed, or destructively transformed.

## Feature flags

- `AIFROGI_CHANNEL_CORE_ENABLED`: enables neutral routing services.
- `AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED`: writes neutral records while legacy remains authoritative.
- `AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS`: comma-separated workspace allowlist required for shadow writes.
- `AIFROGI_CHANNEL_NEUTRAL_READ_ENABLED`: reads the neutral conversation model.
- `AIFROGI_WEBSITE_CHANNEL_ENABLED`: enables website connector endpoints.
- `AIFROGI_AGENT_OPERATIONS_ENABLED`: enables Phase 2 orchestration and traces.

All flags default to false. Production activation requires an explicit workspace allowlist before pilot traffic is enabled.

## Backward compatibility

- Existing WhatsApp webhooks, templates, campaigns, and workspace screens remain unchanged in Phase 1.
- `Lead` and `LeadMessage` remain writable and readable.
- Neutral records hold nullable links to legacy records.
- The WhatsApp adapter delegates to the current service rather than reimplementing provider behavior.
- Existing `LEADOS_*`, Meta, Twilio, and auth environment variables remain supported.
- Disabling the channel-core flags returns traffic to the current path without a data rollback.

## Test strategy

- Contract tests run against every adapter.
- Tenant-boundary tests reject cross-workspace connections and conversations.
- Compatibility tests prove WhatsApp delegates to the legacy service with unchanged inputs.
- Duplicate provider events and idempotency keys are tested.
- Existing verification scripts, lint, typecheck, Prisma generation, and production build remain release gates.
- Phase 2 adds curated conversation evaluations, injection tests, policy tests, and tool-verification tests.

## Rollback strategy

1. Disable all channel-core flags.
2. Keep the existing webhook and WhatsApp service authoritative.
3. Stop shadow writes; do not delete neutral records.
4. Revert the application release if required.
5. Preserve additive tables for investigation and later retry.
6. No rollback step drops or rewrites production customer data.

## Delivery phases and acceptance criteria

### Phase 0 - safety baseline

- Architecture, risks, flags, verification, and rollback are documented.
- Current lint, typecheck, build, and verification results are recorded.
- Production and GitHub source are reconciled before migration deployment.

### Phase 1 - channel-independent foundation

- Neutral contracts and registry compile.
- WhatsApp implements the channel contract through a compatibility port.
- Additive Prisma models generate successfully.
- Cross-workspace routing is rejected by tests.
- Existing WhatsApp routes and campaigns are unchanged.
- All new flags default to false and provide instant rollback.

### Phase 2 - AI Operations

- Every AI response has an agent run and redacted trace.
- Low-confidence and restricted cases escalate.
- Human takeover pauses the bot; return to bot is explicit.

### Phase 3 - website channel

- Website and WhatsApp use the same conversation services.
- Origins, sessions, abuse controls, and channel enablement are enforced.
- Both channels appear in one operations inbox.

### Phase 4 - first verified vertical workflow

- PingBook checks availability, confirms permission, writes idempotently, reads back the appointment, and records an evidence-backed outcome.
- Failures and exceptions hand over with context.

### Phase 5 - outcomes and analytics

- Outcomes include workspace, conversation, actor, timestamp, evidence, and attribution.
- Revenue is never inferred from message volume.

### Phase 6 - frontend migration

- Navigation moves from WhatsApp-first labels to AI Operations concepts.
- Conversations show channel, intent, missing information, confidence, tool results, ownership, and outcomes.
- Campaigns remain an optional Outreach module.

### Phase 7 - hardening

- Load, retry, dead-letter, provider outage, restore, retention, DPDP, audit export, usage metering, and monitoring gates pass.

## Implementation evidence

- The additive migration applied successfully to an isolated database restored from the protected production dump.
- All five neutral tables were created without modifying legacy tables or records.
- The temporary validation database was removed after the migration check.
- Eight focused tests cover adapter normalization, tenant-safe routing, outbound compatibility, policy enforcement, replay idempotency, disabled fallback, and contained shadow-write failure.
- Prisma generation, typecheck, lint, production build, and browser-bundle secret verification pass. Lint retains only pre-existing warnings.

## Immediate implementation boundary

This change implements Phase 1 only. It does not add `AgentRun`, tools, outcomes, a website connector, neutral frontend reads, or a frontend redesign. Existing WhatsApp and campaign behavior remains authoritative. Neutral writes require `AIFROGI_CHANNEL_CORE_ENABLED=true`, `AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED=true`, and membership in `AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS`; disabling either flag or removing the workspace from the allowlist is the immediate fallback.
