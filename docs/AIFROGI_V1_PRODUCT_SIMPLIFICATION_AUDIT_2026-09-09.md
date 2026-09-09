# AiFrogi v1 product simplification audit

Status date: 9 September 2026  
Scope: website-bot client workspace, Super Admin workspace, public product surfaces and repository routes.
Decision rule: remove or hide unsupported and duplicated UI; retain data, audit history and dormant implementation until dependency checks prove code deletion is safe.

Implementation status: all three approved UI-cleanup batches are complete locally. Production deployment remains pending under `PS-001`.

## Executive decision

The core client menu is correct: **Today, Leads, Team Inbox, Intelligence, Improve My Bot, Reports, Setup, Billing, Support and Settings**. Do not reduce this further before the second pilot.

The main problem is old WhatsApp/business-verification onboarding and duplicated operational controls behind otherwise-correct menu items. The first cleanup must simplify these journeys, not redesign the working widget or intelligence runtime.

## Remove or hide now

| Priority | Surface | Finding | Recommendation | Preserve |
|---|---|---|---|---|
| P0 | Client Settings | Production still shows **WhatsApp API** and the subtitle says “WhatsApp connection,” although WhatsApp is outside the current product. | Remove the card and all WhatsApp wording from Client Settings. | Dormant server implementation for a future separate product. |
| P0 | Client onboarding | Website-bot onboarding shows business verification, GST/registration, proof documents, a pending Super Admin KYC gate and disabled WhatsApp/channel choices. A valid website bot can therefore appear only 50% complete and blocked on an irrelevant review. | Remove KYC/GST/proof-document requirements from the website-bot path. Remove disabled WhatsApp choices and make website delivery implicit. Readiness must depend on bot identity, approved intelligence, testing and installation—not KYC. | Company name, owner email/mobile, website, address/hours when useful as bot knowledge. |
| P0 | Super Admin customer record | **Approve KYC**, **Request changes**, GST/registration and business-proof documents remain visible despite the approved website-bot scope. | Remove these controls and fields from the website-bot customer view. Replace “Owner verified” with “Account access confirmed.” | Suspend/reactivate/remove operations and immutable audit history. |
| P1 | Client Knowledge | **Governed improvement routing**, **Correction queue**, and **Unanswered customer questions** repeat Improve My Bot and expose internal operating language. | Remove these three client-facing sections from Intelligence. Keep Intelligence focused on sources, approved answers, coverage and testing; route all feedback/gaps to Improve My Bot. | All underlying flags, gaps, routing records and APIs. |
| P1 | Client Today | **Usage matrix · Hard-stop protected** duplicates Billing and does not tell the client how many replies remain. | Remove this readiness tile. Billing remains the single source for credits and availability. | Bot readiness, current attention, human response and support updates. |
| P1 | Super Admin Message Matrix | It mixes Billing limits/free credits with answer quality already available in Billing and Intelligence Operations. This creates three competing operational views. | Remove it from navigation after moving **Grant free credits** into the customer Billing record. Redirect the old route to Admin Billing. | Credit recommendation and grant logic; quality metrics in Intelligence Operations. |
| P1 | Super Admin Billing | **Connectors & add-ons** advertises Google, CRM, commerce, PMS and custom API charges before these connectors are generally available in v1. | Hide the tab, customer table column and add-connector form until a connector is actually contracted. | Existing add-on rows and billing schema for future activation. |
| P1 | Client Leads | Current component still contains WhatsApp filters/copy and a broad manual-lead CRM interface. | Remove WhatsApp wording/filter immediately. Keep captured website leads; hide manual-lead creation unless the second pilot proves it is needed. | Existing lead records, grading, consent context and team follow-up. |
| P2 | Client Settings | **Bot persona and onboarding** duplicates Setup; **Billing and usage** duplicates the permanent Billing menu. | Link persona directly to Setup or remove this card. Remove the Billing card. Keep Settings focused on team access and security. | Initial signup/onboarding route for new accounts until its simplified replacement is proven. |
| P2 | Public website | Integration marketing claims Shopify, WooCommerce, CRM, payment, order and booking actions that are not the current proven website-bot offer. The footer exposes this page. | Remove the Integration footer link for v1 and change the page to a clearly labelled assisted/future capability, or temporarily redirect it to Support. | Provider research, logos and connector code outside customer-visible navigation. |
| P2 | Public help | WhatsApp articles are filtered from Help/Resources, but legacy articles remain addressable directly through their slugs. | Return not-found for deferred WhatsApp/Meta articles in the website-bot application and keep them out of sitemap/indexing. | Article source for the future separate WhatsApp product. |
| P2 | Retired routes | `/workflows`, `/admin/appointments`, `/admin/demo-sandboxes` and `/admin/pingbook-demo` are redirect-only compatibility routes. | Keep redirects for now; do not show them in navigation. Delete only after access logs show no real traffic. | Safe backward compatibility. |

## Keep for v1

- Client **Today** for action and support summary.
- **Leads** for consented customer opportunities and client-owned details.
- **Team Inbox** for website conversations and conclusive human response.
- **Intelligence** for tenant sources, approved answers, coverage and answer testing.
- **Improve My Bot** as the single correction and missing-answer queue.
- **Reports** for real monthly history and PDF export.
- **Setup** for appearance, behaviour, main menu, checklist and embed options.
- **Billing** for trial, effective reply balance, purchase, grants, transaction history and payments.
- **Support** for client–Super Admin interaction.
- **Settings** for team access and security only.
- Super Admin **Command Center, Customers, Billing, Capacity, Knowledge health, Intelligence Operations, Support and Audit trail**.

## Do not delete yet

- Database columns, transaction history, onboarding activities, support-access logs or knowledge evidence.
- WhatsApp, Meta, connector, appointment and FlowCart source modules until imports, scheduled jobs, webhooks and database dependencies are mapped.
- Existing customer records created under the old onboarding model.

Hiding an unavailable capability is a product correction. Deleting shared historical or server code without a dependency map is an avoidable operational risk.

## Recommended implementation sequence

### Batch 1 — website-client clarity

1. Remove WhatsApp from Client Settings.
2. Simplify website onboarding by removing KYC/GST/proof and disabled WhatsApp choices.
3. Remove duplicated/internal sections from Client Intelligence and Today.

Acceptance: a new website-bot client can move from signup to Setup/Intelligence without KYC or WhatsApp language, and existing clients retain all approved knowledge.

### Batch 2 — Super Admin clarity

1. Remove KYC/business-proof UI from website-bot customer records.
2. Move free-credit grants into Billing and retire Message Matrix navigation.
3. Hide connector/add-on sales controls until contracted.

Acceptance: every visible Super Admin control supports current website-bot onboarding, billing, intelligence, support or capacity operations.

### Batch 3 — public promise alignment

1. Remove or relabel unsupported Integration claims.
2. Block direct legacy WhatsApp help pages from the website-bot application.
3. Remove WhatsApp wording from Leads and any remaining public/client copy.

Acceptance: a visitor or pilot client cannot reasonably conclude that WhatsApp, autonomous booking, commerce or general connectors are included in current v1.

## Scope boundary

This cleanup changes UI routing and presentation only; historical records and dormant server modules remain preserved. Core Intelligence `CI-010` remains a separate pending batch and must not be combined with this product simplification work.
