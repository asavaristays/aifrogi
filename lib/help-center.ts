export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  outcome: string;
  minutes: number;
  steps: Array<{ title: string; body: string }>;
  checks: string[];
};

export const helpArticles: HelpArticle[] = [
  {
    slug: "whatsapp-api-cost-india-uae",
    category: "Buying guide",
    title: "WhatsApp Business API cost in India and UAE",
    summary: "Understand the separate costs for AiFrogi, Meta messages, tax, AI usage, and optional integration work before choosing a plan.",
    outcome: "You can estimate the total operating cost for an India or UAE audience without confusing Meta charges with the platform subscription.",
    minutes: 5,
    steps: [
      { title: "Separate platform and Meta costs", body: "AiFrogi charges for the workspace, automation, support, and plan allowances. Meta separately charges eligible template messages according to category, destination market, and applicable volume rules." },
      { title: "Choose India or UAE by recipient", body: "Meta pricing follows the recipient market rather than only the sender's business location. Estimate India and UAE audiences separately when a campaign contains both." },
      { title: "Include implementation only when needed", body: "Standard available connectors and custom integration work are shown separately. Payment-provider, commerce, CRM, or bespoke API fees are not hidden inside Meta usage." },
      { title: "Start with the 15-day trial", body: "The trial lasts 15 days and then paid actions pause automatically. Use it to validate onboarding, inbox, template, and workflow fit before activating a paid plan." }
    ],
    checks: ["Recipient markets identified", "Meta usage separated from AiFrogi fee", "Tax and integration work considered", "Trial expiry understood"]
  },
  {
    slug: "whatsapp-business-app-vs-api",
    category: "Buying guide",
    title: "WhatsApp Business App vs API: when to move",
    summary: "Choose between the WhatsApp Business App and Business Platform based on team access, automation, campaigns, integrations, and operational control.",
    outcome: "You know whether the free Business App still fits or a managed Business Platform workspace is justified.",
    minutes: 6,
    steps: [
      { title: "Stay with the App for simple, manual work", body: "The WhatsApp Business App is a strong fit when a small team handles conversations manually and does not need governed automation, campaign operations, integrations, or detailed reporting." },
      { title: "Consider the Platform when work becomes shared", body: "The Business Platform becomes useful when several people need defined access, one inbox, reliable routing, approved campaign workflows, automation, integrations, and an operational record." },
      { title: "Compare total operating effort", body: "Look beyond subscription price. Include missed enquiries, repeated manual follow-up, shared-device risk, integration work, Meta message charges, onboarding, and the time needed to manage quality and consent." },
      { title: "Plan the number path before changing anything", body: "Do not remove or migrate a working number until its current WhatsApp setup, Meta business, SIM access, billing, and onboarding path have been checked. Eligibility and number options can vary." }
    ],
    checks: ["Number ownership and SIM access confirmed", "Team and permission needs documented", "Automation use cases are specific", "Meta charges and onboarding work understood"]
  },
  {
    slug: "connect-whatsapp",
    category: "Get started",
    title: "Connect your WhatsApp number",
    summary: "Prepare the business, number, and Meta approval without sharing passwords, tokens, or OTPs with AiFrogi.",
    outcome: "Your number is connected, webhook health is confirmed, and a test reply returns to the Inbox.",
    minutes: 12,
    steps: [
      { title: "Confirm the business details", body: "Use the legal business name, working website, business address, owner email, and the WhatsApp number you want to connect." },
      { title: "Choose the number path", body: "Tell AiFrogi whether WhatsApp is already active on the number. Existing numbers may require a short migration step." },
      { title: "Continue with Facebook", body: "Sign in directly with Meta and select the correct business, WhatsApp account, and phone number. AiFrogi never asks for your Facebook password." },
      { title: "Send the safe test", body: "Use Setup to send one approved test message, reply from the recipient phone, and confirm the inbound message appears in Inbox." }
    ],
    checks: ["Business and website details match", "The SIM can receive an OTP", "Meta billing has no blocker", "Test inbound and outbound messages both pass"]
  },
  {
    slug: "resolve-message-delivery",
    category: "Messaging",
    title: "Resolve a message delivery issue",
    summary: "Work through the few checks that explain most failed or missing WhatsApp messages.",
    outcome: "The exact blocker is identified and the next retry is safe.",
    minutes: 5,
    steps: [
      { title: "Check connection health", body: "Open Setup and confirm WhatsApp, token, webhook, and phone status are healthy." },
      { title: "Check the message rule", body: "Outside the 24-hour service window, use an approved template. Free-form messages can only be sent during an active customer conversation window." },
      { title: "Check template and recipient", body: "Confirm the template is approved for the selected language and the phone number includes its country code." },
      { title: "Check billing and quality", body: "Confirm Meta billing is active and the phone quality rating is not restricted before retrying." }
    ],
    checks: ["Approved template selected", "Recipient consent recorded", "Meta payment method active", "Phone quality rating is healthy"]
  },
  {
    slug: "send-compliant-campaign",
    category: "Campaigns",
    title: "Send a compliant campaign",
    summary: "Prepare, test, approve, and measure a broadcast without skipping consent or cost checks.",
    outcome: "A small, opted-in audience receives an approved template with complete delivery evidence.",
    minutes: 8,
    steps: [
      { title: "Select the audience", body: "Use contacts with a documented WhatsApp opt-in and remove duplicates, opt-outs, and invalid numbers." },
      { title: "Select the approved template", body: "Choose a synchronized Meta template and review every variable, button, image, and language." },
      { title: "Send a test first", body: "Send to an internal test contact and confirm image, text, buttons, link destination, and reply routing." },
      { title: "Confirm and monitor", body: "Review estimated reach and Meta cost, confirm compliance, then watch sent, delivered, read, replied, and failed counts." }
    ],
    checks: ["Consent evidence present", "STOP handling enabled", "Test message approved", "Estimated Meta cost reviewed"]
  },
  {
    slug: "govern-ai-answers",
    category: "Knowledge and AI",
    title: "Keep AI answers accurate",
    summary: "Control what the assistant knows, how it answers, and when a person must take over.",
    outcome: "Answers use approved business truth and uncertain or sensitive requests reach a human.",
    minutes: 10,
    steps: [
      { title: "Approve the sources", body: "Connect the business website and upload only current documents that the assistant is allowed to use." },
      { title: "Set workspace instructions", body: "Define tone, service boundaries, required questions, prohibited claims, and escalation topics." },
      { title: "Review knowledge gaps", body: "Use unanswered questions to add missing information instead of allowing the model to guess." },
      { title: "Test before automation", body: "Preview representative questions, complaints, billing requests, and unsupported requests before enabling replies." }
    ],
    checks: ["Sources are current", "Sensitive topics require handoff", "Low confidence falls back safely", "A human can pause automation"]
  },
  {
    slug: "repair-an-ai-bot",
    category: "Knowledge and AI",
    title: "Repair an AI bot safely",
    summary: "Classify a failed answer, correct the right layer, preserve tenant isolation, and prove the repair before resolving its evidence.",
    outcome: "A Client Admin can repair business knowledge without code, while intelligence and connector defects reach the correct AiFrogi owner.",
    minutes: 8,
    steps: [
      { title: "Start from evidence", body: "Open Knowledge and review Governed improvement routing, negative feedback, incorrect-fact flags, knowledge gaps, conflict state and the original customer question. Do not repair from memory alone." },
      { title: "Choose the repair layer", body: "Missing or incorrect business truth belongs to the tenant Knowledge layer. Intent, context, repetition, persona or evidence errors belong to shared intelligence. Live booking, availability, payment, order or external updates belong to the connector layer." },
      { title: "Contain risk first", body: "Pause an incorrect fact immediately. Keep disputed or expired claims out of retrieval. Suspend connector writes when completion cannot be verified. Unaffected answers may continue operating." },
      { title: "Correct tenant knowledge", body: "Create a precise atomic claim or an explicit superseding version. Complete named field approval and read the actual customer-facing Preview Approval before publication." },
      { title: "Escalate shared defects", body: "Send intent, context, loop, persona-boundary and evidence-classification defects to AiFrogi Engineering. The repair must add a universal regression case so future bots inherit it safely." },
      { title: "Certify connector repairs", body: "Verify tenant scope, authentication, idempotency, read-back and safe failure before re-enabling any external write action. Never infer a completed action from a request alone." },
      { title: "Retest and close", body: "Retest the original wording, two paraphrases, a contextual follow-up and a nearby unsafe case. Resolve the flag or gap only after the publication or connector gate passes and the evidence matches observed behaviour." }
    ],
    checks: ["Failure layer identified", "Risk contained before editing", "No cross-tenant fact copied", "Approvals and regression gate passed", "Original question and variants retested"]
  },
  {
    slug: "manage-team-access",
    category: "Account and security",
    title: "Manage team access safely",
    summary: "Give each person a private account and only the permissions needed for their work.",
    outcome: "Owners, admins, agents, and viewers see the correct product surfaces without shared credentials.",
    minutes: 4,
    steps: [
      { title: "Invite the person", body: "Use their individual work email and choose the least-privilege role that fits their responsibility." },
      { title: "Confirm activation", body: "The invited person creates a private password through the time-limited activation link." },
      { title: "Review access regularly", body: "Suspend unused accounts immediately and review owners and admins after staff or agency changes." },
      { title: "Protect credentials", body: "Never place passwords, OTPs, permanent tokens, payment details, or customer exports in support messages." }
    ],
    checks: ["No shared user accounts", "Every person has the correct role", "Former users are suspended", "Sensitive credentials stay out of tickets"]
  },
  {
    slug: "protect-whatsapp-customer-data",
    category: "Account and security",
    title: "How AiFrogi protects WhatsApp customer data",
    summary: "A plain-English guide to workspace boundaries, customer-approved support access, OTP, signed Meta webhooks, and safe AI handover.",
    outcome: "You know what AiFrogi protects, what customers control, and what should never be shared with support.",
    minutes: 5,
    steps: [
      { title: "Each customer workspace stays separated", body: "Contacts, messages, documents, campaign activity, knowledge, and integration settings are scoped to the customer workspace. Server-side checks refuse covered cross-workspace access attempts." },
      { title: "Support access is customer-approved", body: "AiFrogi support cannot freely read private customer content by default. Workspace owners/admins grant time-bound access by scope, and access activity is recorded." },
      { title: "Privileged sign-in uses OTP", body: "Platform admin and workspace owner/admin accounts require password verification plus an email OTP before a session is created." },
      { title: "Meta webhook traffic is signed", body: "Production Meta webhook requests must include a valid signature from the Meta app secret. Unsigned or forged JSON webhook requests are rejected." },
      { title: "AI stays inside approved knowledge", body: "AI replies use approved business sources, workspace instructions, confidence fallback, and human handover for sensitive or uncertain conversations." },
      { title: "Never share secrets in support", body: "Do not send passwords, OTPs, permanent Meta tokens, payment card details, customer exports, or raw webhook secrets in tickets, chat, screenshots, or email." }
    ],
    checks: ["Support access is granted only when needed", "Owners/admins use their own login and OTP", "No password, OTP, or Meta token is shared", "Sensitive AI replies can reach a human"]
  },
  {
    slug: "support-response-standards",
    category: "Support",
    title: "AiFrogi support response standards",
    summary: "Know how incidents are prioritized, when to expect an initial response, and what information support can access.",
    outcome: "You can choose the correct priority and understand the response target without sharing private credentials.",
    minutes: 3,
    steps: [
      { title: "Urgent: live messaging stopped", body: "For a confirmed platform-wide or workspace messaging outage, AiFrogi targets an initial response within 1 business hour during support hours. Availability and recovery depend on whether the issue belongs to AiFrogi, Meta, or another provider." },
      { title: "High: important work is blocked", body: "For onboarding, campaign, billing, or access blockers without a full outage, AiFrogi targets an initial response within 4 business hours." },
      { title: "Normal: guidance and planned changes", body: "For how-to questions, configuration requests, and planned integration work, AiFrogi targets an initial response within 1 business day." },
      { title: "Customer data remains controlled", body: "Support starts with operational metadata. Private conversations, documents, or knowledge require a workspace owner/admin to grant time-bound, scoped support access." }
    ],
    checks: ["Correct priority selected", "Workspace and approximate time included", "No password, OTP, or Meta token included", "Customer content access granted only if required"]
  },
  {
    slug: "get-support",
    category: "Support",
    title: "Get help with useful context",
    summary: "Create a support request that reaches the right operator with your workspace context already attached.",
    outcome: "AiFrogi can diagnose the issue without asking you to share credentials or repeat setup details.",
    minutes: 3,
    steps: [
      { title: "Choose the category", body: "Select onboarding, WhatsApp, billing, campaign, automation, account, or other so the request reaches the correct queue." },
      { title: "Describe the blocker", body: "Explain what you were doing, what you expected, what happened, and when it last worked." },
      { title: "Choose priority honestly", body: "Use Urgent only when live messaging is stopped; use High when work is blocked and Normal for ordinary help." },
      { title: "Follow the same ticket", body: "Keep replies in one request so the complete history and resolution remain auditable." }
    ],
    checks: ["No secrets included", "Expected and actual result described", "Approximate time included", "One issue per ticket"]
  }
];

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug) ?? null;
}
