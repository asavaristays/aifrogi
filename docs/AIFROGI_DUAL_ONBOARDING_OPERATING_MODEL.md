# AiFrogi Dual Onboarding Operating Model

Last updated: 1 September 2026  
Status: Canonical pilot operating rule

AiFrogi has two independent onboarding tracks. Super Admin must never use Meta readiness as the status of a Website AI Bot, and must never mix website installation approval into WhatsApp channel activation.

## AI Bot onboarding

1. Select persona and business objective.
2. Complete business identity.
3. Add and approve knowledge.
4. Preview and approve governed answers.
5. Configure authority, human handover and optional connectors.
6. Generate JavaScript, WordPress, iframe and standalone delivery.
7. Detect website installation.
8. Super Admin verifies readiness and makes the AI Bot live.

Meta, WhatsApp number, templates, token and webhook are not requirements for this track.

## WhatsApp onboarding

1. Deliberately enable the `WHATSAPP` channel for the bot.
2. Verify business/KYC and prepare the phone number.
3. Complete secure Meta connection and approval.
4. Validate token and signed webhook health.
5. Approve the first template and pass the first-message test.
6. Confirm billing readiness and enable the WhatsApp channel.

The WhatsApp track reuses the same tenant, persona, knowledge, consent, evidence and human-handover controls. It does not create a second bot brain.

## Super Admin rule

- The customer queue shows separate AI Bot and WhatsApp statuses.
- Customer detail opens into separate `AI Bot Onboarding` and `WhatsApp Onboarding` tabs.
- Website-only pilots do not display Meta operational controls.
- WhatsApp controls appear only when `botProfile.channels` includes `WHATSAPP`.
- Billing, documents, account verification and audit evidence remain shared operations below both tracks.
- Live state is channel-specific: `AI Bot Live` is not evidence that WhatsApp is live, and `WhatsApp Live` is not evidence that website installation is approved.

## Pilot operating instruction

For the first five Website AI Bot pilots, open the AI Bot onboarding track, complete knowledge and preview approval, install the generated code, confirm installation detection, and then use the Super Admin live control. Do not wait for Meta unless that pilot explicitly purchased or requested WhatsApp.
