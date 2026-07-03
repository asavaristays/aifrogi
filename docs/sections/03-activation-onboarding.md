# Section 03: Activation And Onboarding

Status: In progress
Target score: 8.5/10

## Think

Primary user: a business owner who wants WhatsApp operations without learning Meta terminology or sharing credentials.

Primary job: move from interest to a verified, live workspace and a successful first message with one clear action at each stage.

## Product Flow

Marketing trial CTA -> Business registration -> Email ownership verification -> Personal password -> Prerequisite checklist -> Organization and KYC -> WhatsApp number -> Secure Meta connection -> Meta review -> Template readiness -> Test message -> Live workspace.

## Rethink

- Registration captures only what is needed to reserve the workspace.
- Sensitive business and Meta steps happen after authenticated ownership verification.
- Every onboarding state identifies the owner: You, AiFrogi, or Meta.
- Technical concepts are translated into business outcomes.
- A client never sends passwords, OTPs, permanent tokens, or Facebook credentials to support.
- Embedded guidance and short video help appear at the moment they are needed.

## Implementation Blocks

1. Self-service trial registration with abuse protection and duplicate-account recovery.
2. One-time email activation and personal owner password.
3. Trial dates, activation status, and onboarding lifecycle telemetry.
4. Predictive prerequisites with save-and-resume behavior.
5. Meta embedded signup and status reconciliation.
6. Template approval readiness and first test-message verification.
7. Welcome email and activation checklist.

## Implemented Increment 1

- Public `/register` business trial form with company, owner, website, industry, country, mobile, and time zone.
- Marketing and login trial actions route to registration instead of returning new customers to sign-in.
- Trial registration creates an isolated organization, property, pending Owner, onboarding profile, and activity history.
- A private 24-hour activation link is delivered through the configured AiFrogi mailbox.
- Pending registrations can safely rotate the activation link and correct business details.
- Owner activation reuses the personal-password system and advances the organization from `PENDING_EMAIL` to `ONBOARDING`.
- Registration includes same-origin enforcement, IP/email attempt limits, a bot-trap field, normalized website validation, and globally serialized email registration.
- A disposable lifecycle verification covers registration, token rotation, owner activation, state transitions, audit activity, and complete cleanup.
- Desktop and 390px mobile layouts were visually verified with no horizontal overflow; mobile shows the form before explanatory content.

## Implemented Increment 2

- A shared onboarding guidance engine classifies the current blocker, owner, next action, ETA, support note, and target step.
- The authenticated onboarding screen now opens with a `Today` action card so the client sees the next move before forms and technical detail.
- 30-day trial timing is calculated from workspace creation and shown in the onboarding sidebar.
- The first messaging-test readiness check now accepts the live `CONNECTED` webhook state.
- Super Admin customer lists show next action, owner, ETA, trial status, and an AiFrogi-owned queue count.
- Super Admin customer detail pages show the current blocker and support note before detailed configuration panels.
- Registration verification now tests guidance and trial-window calculation as part of the lifecycle.

Remaining increments: Meta reconciliation, template readiness, first test-message proof, welcome/lifecycle email content, and drop-off analytics beyond activity history.

## Acceptance Gates

- A new owner can register without Super Admin intervention.
- Email ownership is verified before workspace access becomes active.
- Duplicate and expired registration paths have a safe recovery action.
- Registration does not reveal whether unrelated customer data exists.
- The first authenticated screen shows the exact next onboarding action.
- A customer can reach first successful test message without sharing credentials.
- Activation, drop-off, time-to-live, and blocker ownership are measurable.
- Tenant isolation, role authorization, rate limits, typecheck, build, responsive QA, and production health pass.

## Achieve Definition

The section is complete when a new external test customer can independently create, activate, connect, test, and enter the live product while Super Admin can observe each stage and blocker.
