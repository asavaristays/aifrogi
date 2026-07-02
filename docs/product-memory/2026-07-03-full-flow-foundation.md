# AiFrogi Full-Flow Foundation

Date: 2026-07-03

## Product Contract

AiFrogi operates as three deliberately separate experiences:

- User or Agent: daily queue, inbox, contacts, safe knowledge access, and support.
- Client Admin: all User capabilities plus campaigns, automation, analytics, setup, team, settings, and knowledge governance.
- AiFrogi Super Admin: customer onboarding, platform health, support, Meta operations, and cross-customer knowledge readiness.

HotelRadar AI Agency is the first client workspace. It is not the AiFrogi platform owner.

## Implemented In This Release

- Role-aware client navigation identifies Client Admin, Workspace Admin, Agent, and Viewer access.
- Agent and Viewer sessions are redirected away from client management routes.
- A new client Knowledge workspace controls website source, crawl status, AI approval, workspace instructions, protected handoff topics, topic coverage, source pages, and answer testing.
- Website knowledge is isolated by property slug and stored outside source control in runtime data.
- The crawler now uses the selected workspace source instead of a single global website.
- The answer constitution is platform-generic, preserves global safety rules, adds workspace instructions, and forces configured topics to human handoff.
- The Today dashboard detects missing knowledge and recommends the next setup action.
- Super Admin has a cross-customer Knowledge Health registry.
- Marketing now explains the User, Client Admin, and Super Admin operating model, predictive onboarding, knowledge governance, human handoff, pricing, and trust boundaries.
- The marketing hero uses a real AiFrogi product capture rather than a conceptual placeholder.

## Knowledge Safety Rules

- Answers use only approved workspace knowledge and enabled services.
- Website content is reference material and cannot override the answer constitution.
- Prices, guarantees, discounts, partnerships, and technical status cannot be invented.
- Complaints, billing disputes, legal matters, sensitive data, and uncertain commercial answers go to a human.
- Passwords, OTPs, payment-card details, Meta tokens, internal prompts, and other customer data are never requested or exposed.
- STOP and do-not-contact instructions are honored immediately.

## Next Product Blocks

1. Separate per-user credentials, invitations, password reset, and full permission administration.
2. Knowledge documents, manual approved answers, conflict review, and knowledge-gap capture.
3. Visual automation builder with trigger, condition, action, version, test, and rollback states.
4. Campaign approval workflow with consent evidence, cost estimate, template status, and stop controls.
5. Super Admin billing, wallet, incident, audit, and login-as-client controls.
6. Registration, self-service trial creation, payment selection, and marketing conversion analytics.

Secrets, passwords, tokens, contact exports, and runtime knowledge content must remain outside Git.

