# AiFrogi Bot Profile Onboarding

AiFrogi models one intelligent business bot with independently configurable purpose, channels, capabilities, and authority.

Every profile represents a sovereign business bot. Its approved knowledge, business context, permissions, conversation history, and verified outcomes belong to and remain isolated for that business. OpenAI or another model provider may process the minimum approved context, but the provider is not the bot's source of truth or the owner of its intelligence.

## Configuration dimensions

- Category: Regular AI Business Bot, ClinicGPT, FlowCart, Stay, or Custom.
- Channels: Website Bot, WhatsApp Bot, or both.
- Operating mode: answer only, lead capture, approved actions, or human approval.
- Capabilities: questions, lead capture, qualification, appointments, and orders.
- Safety: human takeover and approval before business actions.

WhatsApp is a channel, not a bot category. Existing WhatsApp integration and message behavior remain unchanged by bot-profile selection.

## Webtechnosys reference demo

Webtechnosys is the first reusable `BUSINESS_AI` reference tenant:

- Website and WhatsApp selected as channels.
- Public knowledge source: `https://webtechnosys.com`.
- Service questions, lead capture, and lead qualification enabled.
- Human handoff and approval before business actions enabled.
- Knowledge refresh runs from the public site and retains source URLs and crawl timestamps.

This reference tenant demonstrates a configuration that can be reused for other service businesses without copying channel-specific bot logic.
