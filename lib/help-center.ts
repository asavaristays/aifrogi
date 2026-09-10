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
    slug: "create-aifrogi-workspace", category: "Start here", title: "Create your AiFrogi workspace", minutes: 4,
    summary: "Start a trial, verify the owner account and enter the private workspace for your business.",
    outcome: "The business owner can sign in and continue bot setup from Today.",
    steps: [
      { title: "Start the trial", body: "Choose Start 15-day trial and use the business owner’s working email address. Each business receives its own separated workspace." },
      { title: "Enter the business details", body: "Add the real business name, category and owner details. These identify the workspace; they do not automatically become public bot answers." },
      { title: "Verify and sign in", body: "Complete the email verification and use the private login. Never share the owner password or one-time code." },
      { title: "Open Today", body: "Today shows the next incomplete setup action and later becomes the daily operating summary." }
    ], checks: ["Owner email is accessible", "Business name is correct", "Private login works", "Today opens the correct workspace"]
  },
  {
    slug: "upload-business-knowledge", category: "Knowledge and training", title: "Upload Excel, PDF or website knowledge", minutes: 8,
    summary: "Give the bot current, approved business information without mixing another client’s facts.",
    outcome: "Approved sources are staged for review inside the correct business workspace.",
    steps: [
      { title: "Open Intelligence", body: "Choose the business workspace first, then open Intelligence. Knowledge always belongs to one tenant bot." },
      { title: "Choose a source", body: "Upload the AiFrogi Excel template or an approved PDF, or add selected public website pages. A website is optional." },
      { title: "Keep facts precise", body: "Use one clear fact per answer. Include only information customers may receive, such as services, schedules, policies and public contact details." },
      { title: "Review validation", body: "Resolve missing fields, expired information and conflicts before approving any customer-facing answer." }
    ], checks: ["Source belongs to this business", "Information is current", "No passwords or private customer data", "Conflicts are resolved"]
  },
  {
    slug: "review-approve-bot-answers", category: "Knowledge and training", title: "Review, edit and approve bot answers", minutes: 7,
    summary: "Train the tenant bot by approving the exact answers customers are allowed to receive.",
    outcome: "Only reviewed business truth is available to the live bot.",
    steps: [
      { title: "Read the customer question", body: "Check what a real customer is likely to mean, including variations and follow-up wording." },
      { title: "Review the answer as shown", body: "Confirm names, numbers, prices, schedules, links and promises against the approved source." },
      { title: "Edit and save", body: "Use Edit when needed, make the answer direct and natural, then choose Save and approve. Delete obsolete drafts and pause uncertain facts." },
      { title: "Test after approval", body: "Ask the original question, two paraphrases and one contextual follow-up in Test my bot." }
    ], checks: ["Answer is factually correct", "Tone sounds natural", "No unsupported promise", "Variants pass testing"]
  },
  {
    slug: "understand-bot-persona", category: "Knowledge and training", title: "Understand persona and bot intelligence", minutes: 5,
    summary: "Know what shapes the bot’s role and tone, and what must remain tenant-specific business truth.",
    outcome: "The bot sounds appropriate for its category without inventing client facts.",
    steps: [
      { title: "Choose the correct bot family", body: "The bot family supplies a shared role, conversational style, safety boundaries and appropriate escalation behaviour." },
      { title: "Add tenant truth separately", body: "Services, prices, schedules, contact numbers and policies must come from this client’s approved knowledge—not the shared persona." },
      { title: "Test tone and context", body: "Check greetings, direct questions, follow-ups and commercial interest. The bot should answer first and qualify only when useful." },
      { title: "Improve through evidence", body: "Use feedback and missing-answer records to correct the right layer. Visitor messages never silently rewrite approved knowledge." }
    ], checks: ["Correct bot family selected", "Tenant facts remain separate", "Answer-first behaviour confirmed", "No silent self-training assumed"]
  },
  {
    slug: "design-bot-appearance-menu", category: "Design and engagement", title: "Design bot appearance and Main menu", minutes: 6,
    summary: "Set the logo, colour, welcome content and customer choices for a clear first impression.",
    outcome: "The bot opens responsively with a useful, branded Main menu.",
    steps: [
      { title: "Set the identity", body: "Open Setup · Bot appearance and add the bot name, approved logo, brand colour and welcome message." },
      { title: "Add a welcome highlight", body: "Optionally add one image and short text for a current offer or important introduction. Keep it readable on mobile." },
      { title: "Build the Main menu", body: "Use short customer-facing labels such as Services, Training, Book a consultation or Contact our team." },
      { title: "Connect useful prompts", body: "Each menu choice should open a meaningful customer question, not an internal department name or empty page." }
    ], checks: ["Logo is clear at small size", "Colour has readable contrast", "Welcome content is current", "Every menu item opens a useful path"]
  },
  {
    slug: "publish-standalone-ai-bot", category: "Publish and install", title: "Use the AI Bot without a website", minutes: 4,
    summary: "Publish the trained bot as a standalone web app and share it directly with customers.",
    outcome: "A small business can start answering enquiries and capturing consented leads without owning a website.",
    steps: [
      { title: "Finish knowledge and testing", body: "Approve the business answers and confirm the standalone bot works on desktop and mobile." },
      { title: "Copy the shareable link", body: "Use the standalone web-app link supplied in Setup. It opens the same tenant bot in its own page." },
      { title: "Share it safely", body: "Place the link in email, a social profile, a digital catalogue or a QR code. Anyone with the link can ask public business questions." },
      { title: "Add a website later", body: "When the business launches a website, embed the same bot. Its approved intelligence and operating history do not need to be recreated." }
    ], checks: ["Standalone link opens", "Mobile layout is usable", "No private admin link shared", "Human callback path tested"]
  },
  {
    slug: "install-ai-bot-on-website", category: "Publish and install", title: "Install the AI Bot on a website", minutes: 7,
    summary: "Choose JavaScript or WordPress delivery and verify that the correct tenant bot is live.",
    outcome: "The responsive launcher appears on the intended website and the installation checklist is complete.",
    steps: [
      { title: "Test before copying code", body: "Confirm services, contact facts, context, missing-answer handover and mobile layout in Test my bot." },
      { title: "Choose an embed option", body: "Use the JavaScript snippet for most sites or the supplied WordPress method. Do not alter the tenant slug or script address." },
      { title: "Install once", body: "Add the code before the closing page body or through the approved site-wide code area. Avoid adding the same loader twice." },
      { title: "Verify installation", body: "Open the public website, test the launcher and close control, then confirm Setup detects the installation and marks it complete." }
    ], checks: ["Correct tenant code used", "Only one loader installed", "Desktop and mobile tested", "Checklist shows complete"]
  },
  {
    slug: "manage-leads-team-inbox", category: "Daily operation", title: "Manage Leads and Team Inbox", minutes: 6,
    summary: "Follow up consented enquiries and continue conversations that need a person.",
    outcome: "No genuine customer enquiry is lost when AI needs human help.",
    steps: [
      { title: "Start with Today", body: "Review waiting conversations, new leads and urgent support actions before lower-priority reporting." },
      { title: "Open Team Inbox", body: "Reply to conversations marked for human help. When a person joins, AI pauses so it does not compete with the team." },
      { title: "Review the Lead", body: "Use only the name and mobile number the visitor submitted with consent. Keep the original enquiry context with the lead." },
      { title: "Close conclusively", body: "Reply, complete the agreed follow-up and close the conversation only when the customer has a clear next step." }
    ], checks: ["Consent is recorded", "Enquiry context is visible", "One owner handles the conversation", "Customer receives a clear next step"]
  },
  {
    slug: "manage-ai-credits-billing", category: "Billing", title: "Understand AI credits and Billing", minutes: 5,
    summary: "Track available replies, activate a plan, buy credits and understand account history.",
    outcome: "The client knows when the bot can reply and how credits are added immediately after verified payment or an admin grant.",
    steps: [
      { title: "Read the effective balance", body: "Billing shows usable AI reply credits from the active trial, plan, purchased packs and approved free grants." },
      { title: "Choose the right route", body: "Activate a monthly plan for regular use or buy a credit pack when usage varies. The Super Admin may grant free credits based on reviewed usage." },
      { title: "Confirm allocation", body: "After successful payment or an approved grant, the account balance and transaction history should update immediately." },
      { title: "Act before zero", body: "The bot stops billable AI replies when no effective credits remain. Add credits or activate a plan before a planned campaign or traffic increase." }
    ], checks: ["Correct workspace selected", "Effective balance understood", "Payment or grant appears in history", "Bot reply access confirmed"]
  },
  {
    slug: "improve-missing-wrong-answer", category: "Daily operation", title: "Improve a missing or wrong answer", minutes: 7,
    summary: "Correct the right intelligence layer and prove the repair before making it live.",
    outcome: "The original customer question and its natural variations receive an accurate, approved answer.",
    steps: [
      { title: "Open Improve My Bot", body: "Start with Customer feedback or Missing information and read the original question and answer evidence." },
      { title: "Identify the layer", body: "A missing client fact belongs to tenant knowledge. Tone, intent, context or repetition defects belong to shared intelligence. Do not overlap them." },
      { title: "Edit or add the answer", body: "Correct the customer-facing answer, save it and complete approval. Pause or delete obsolete information." },
      { title: "Retest before closure", body: "Test the original wording, paraphrases, a follow-up and one nearby unsafe case. Close the item only after the behaviour is verified." }
    ], checks: ["Failure layer identified", "Correct tenant selected", "Answer approved", "Original and variants retested"]
  },
  {
    slug: "get-aifrogi-support", category: "Support and security", title: "Get help without exposing private information", minutes: 4,
    summary: "Create a focused support request with useful context and safe access boundaries.",
    outcome: "Support can diagnose one clear issue without receiving passwords, one-time codes or payment secrets.",
    steps: [
      { title: "Open Support inside the workspace", body: "This attaches the correct business context and keeps the complete response history in one place." },
      { title: "Describe expected and actual behaviour", body: "Include the screen, approximate time, what you tried and what should have happened. Keep one issue per ticket." },
      { title: "Choose an honest priority", body: "Use urgent only for a confirmed live outage, high when important work is blocked and normal for guidance or planned changes." },
      { title: "Grant access only when needed", body: "Private conversations and documents remain customer-controlled. If deeper review is necessary, the owner can grant limited, time-bound support access." }
    ], checks: ["Correct workspace and screen included", "No password or one-time code", "No card or API secret", "One issue per ticket"]
  }
];

export const websiteHelpArticles = helpArticles;

export function isWebsiteOnlyHelpArticle(article: HelpArticle) {
  return helpArticles.some((candidate) => candidate.slug === article.slug);
}

export function getHelpArticle(slug: string) {
  return helpArticles.find((article) => article.slug === slug) ?? null;
}
