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
