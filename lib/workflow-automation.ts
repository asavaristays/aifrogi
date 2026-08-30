import type { Lead } from "@/types";

export type WorkflowTemplateStatus = "approved" | "pending" | "not_submitted";

export type WorkflowTemplate = {
  name: string;
  status: WorkflowTemplateStatus;
  category: "MARKETING" | "UTILITY";
  purpose: string;
};

export type WorkflowStep = {
  title: string;
  description: string;
  owner: "AiFrogi" | "AI" | "Staff" | "Meta";
  timing: string;
};

export type AutomationWorkflow = {
  id: string;
  title: string;
  audience: "AiFrogi" | "Client business" | "Both";
  promise: string;
  trigger: string;
  liveSignal: string;
  activeCount: number;
  nextAction: string;
  impact: string;
  templates: WorkflowTemplate[];
  steps: WorkflowStep[];
};

const TEMPLATE_STATUS: Record<string, WorkflowTemplateStatus> = {
  goa_ai_audit_trial_v1: "approved",
  goa_ai_audit_image_v2: "approved",
  trial_intake_followup_v1: "approved",
  audit_request_followup_v1: "approved",
  audit_ready_v1: "approved",
  specialist_callback_v1: "approved",
  booking_enquiry_flow_v1: "approved",
  quote_followup_6hr_v1: "pending",
  quote_followup_24hr_v1: "approved",
  review_request_v1: "approved",
  manager_daily_digest_v1: "approved",
  missed_enquiry_rescue_v1: "pending",
  website_intent_capture_v1: "pending"
};

function template(name: string, category: WorkflowTemplate["category"], purpose: string): WorkflowTemplate {
  return {
    name,
    status: TEMPLATE_STATUS[name] ?? "not_submitted",
    category,
    purpose
  };
}

function textForLead(lead: Lead) {
  return [
    lead.name,
    lead.intent,
    lead.stage,
    lead.stay,
    lead.party,
    lead.budget,
    lead.tags.join(" "),
    ...lead.transcript.map((message) => message.text)
  ].join(" ").toLowerCase();
}

function lastMessage(lead: Lead) {
  return lead.transcript.at(-1) ?? null;
}

function countWhere(leads: Lead[], predicate: (lead: Lead) => boolean) {
  return leads.filter(predicate).length;
}

export function buildAutomationWorkflows(leads: Lead[] = []): AutomationWorkflow[] {
  const auditCount = countWhere(leads, (lead) => {
    const text = textForLead(lead);
    return text.includes("audit") || text.includes("website score") || text.includes("website review");
  });
  const trialCount = countWhere(leads, (lead) => {
    const text = textForLead(lead);
    return text.includes("trial") || text.includes("15-day") || text.includes("15 day");
  });
  const missedCount = countWhere(leads, (lead) => lastMessage(lead)?.from === "guest" && lead.minutesAgo >= 10);
  const quoteCount = countWhere(leads, (lead) => {
    const text = textForLead(lead);
    return lead.stage === "Proposal Sent" || text.includes("quote") || text.includes("tariff") || text.includes("options shared");
  });
  const reviewCount = countWhere(leads, (lead) => {
    const text = textForLead(lead);
    return lead.stage === "Booked" || text.includes("checkout") || text.includes("review");
  });
  const websiteIntentCount = countWhere(leads, (lead) => {
    const text = textForLead(lead);
    return text.includes("website assistant") || text.includes("website & cms") || text.includes("whatsapp automation") || lead.source.toLowerCase().includes("website");
  });
  const hotCount = countWhere(leads, (lead) => lead.score >= 75 || lead.tags.some((tag) => /hot|priority|audit|trial/i.test(tag)));

  return [
    {
      id: "website_intent_router",
      title: "Website Visitor Intent Router",
      audience: "AiFrogi",
      promise: "Make the website bot feel like a guided consultant, then carry the selected intent into WhatsApp and AiFrogi.",
      trigger: "Visitor opens the bottom-right assistant and chooses website, WhatsApp automation, AI audit, trial, or specialist.",
      liveSignal: `${websiteIntentCount} website-routed lead${websiteIntentCount === 1 ? "" : "s"} detected`,
      activeCount: websiteIntentCount,
      nextAction: "Keep the website assistant focused on one next action: audit, trial, or human callback.",
      impact: "Demonstrates that AiFrogi connects website UX, WhatsApp, CRM, and automation in one journey.",
      templates: [
        template("website_intent_capture_v1", "MARKETING", "Follow up with visitors who started on the website"),
        template("specialist_callback_v1", "UTILITY", "Move serious visitors to a human specialist")
      ],
      steps: [
        { title: "Open assistant", description: "Visitor sees clear menu options without Meta or SaaS complexity.", owner: "AiFrogi", timing: "Instant" },
        { title: "Capture selected intent", description: "The option becomes a prefilled WhatsApp message and AiFrogi lead tag.", owner: "AiFrogi", timing: "Instant" },
        { title: "Answer from website knowledge", description: "Bot uses the client-approved website knowledge and answer constitution.", owner: "AI", timing: "Instant" },
        { title: "Route to next action", description: "Lead is guided to audit, trial intake, or human callback.", owner: "Staff", timing: "Same day" }
      ]
    },
    {
      id: "audit_to_trial",
      title: "AI Audit To Trial Conversion",
      audience: "AiFrogi",
      promise: "Turn a campaign click into a structured audit request and then a 15-day trial conversation.",
      trigger: "Visitor clicks Free AI Audit, replies AUDIT, or submits the audit page.",
      liveSignal: `${auditCount} audit-related lead${auditCount === 1 ? "" : "s"} detected`,
      activeCount: auditCount,
      nextAction: auditCount ? "Review audit leads and send the trial intake when details are complete." : "Drive traffic to the audit page or use the approved campaign template.",
      impact: "Proves AiFrogi can convert website interest into qualified WhatsApp leads.",
      templates: [
        template("goa_ai_audit_trial_v1", "MARKETING", "Approved campaign opener"),
        template("goa_ai_audit_image_v2", "MARKETING", "Image campaign opener"),
        template("audit_request_followup_v1", "MARKETING", "Request website or Google Business link"),
        template("audit_ready_v1", "UTILITY", "Share prepared audit summary"),
        template("trial_intake_followup_v1", "MARKETING", "Move qualified audit lead to trial")
      ],
      steps: [
        { title: "Capture intent", description: "AUDIT replies and audit-form submissions create or update a AiFrogi lead.", owner: "AiFrogi", timing: "Instant" },
        { title: "Ask only useful details", description: "Bot asks for website, location, Google Business, and main concern.", owner: "AI", timing: "Instant" },
        { title: "Prepare audit", description: "Staff reviews visibility, WhatsApp CTA, SEO, booking CTA, and trust gaps.", owner: "Staff", timing: "Same day" },
        { title: "Send audit ready", description: "Approved template reopens the conversation when the audit summary is ready.", owner: "Meta", timing: "When ready" },
        { title: "Convert to trial", description: "Trial intake collects property, contact, website, goal, rooms/villas, and notes.", owner: "AiFrogi", timing: "After audit" }
      ]
    },
    {
      id: "smart_booking_desk",
      title: "Smart Booking Desk Demo",
      audience: "Client business",
      promise: "Make a hotel owner feel that every WhatsApp enquiry becomes a clean booking opportunity.",
      trigger: "Guest asks for availability, tariff, rooms, villas, packages, or booking help.",
      liveSignal: `${quoteCount} quote or tariff conversation${quoteCount === 1 ? "" : "s"} in pipeline`,
      activeCount: quoteCount,
      nextAction: quoteCount ? "Send quote follow-up or ask staff to approve the AI reply draft." : "Use a demo lead to show enquiry capture, quote, and follow-up.",
      impact: "Demonstrates revenue discipline: capture, qualify, quote, follow up.",
      templates: [
        template("booking_enquiry_flow_v1", "UTILITY", "Collect dates, guests, room/villa preference, budget"),
        template("quote_followup_6hr_v1", "UTILITY", "First quote nudge"),
        template("quote_followup_24hr_v1", "UTILITY", "Second quote nudge")
      ],
      steps: [
        { title: "Understand enquiry", description: "Classify room, villa, wedding, long stay, package, or callback intent.", owner: "AI", timing: "Instant" },
        { title: "Collect booking fields", description: "Ask check-in, check-out, guests, room/villa type, budget, and special request.", owner: "AiFrogi", timing: "Instant" },
        { title: "Score the lead", description: "Rank by urgency, completeness, budget, and reply behavior.", owner: "AI", timing: "Instant" },
        { title: "Draft quote reply", description: "Staff sees a suggested reply and sends it with one click.", owner: "Staff", timing: "Within SLA" },
        { title: "Follow up automatically", description: "If the guest is silent, approved follow-up templates keep the lead warm.", owner: "Meta", timing: "6h and 24h" }
      ]
    },
    {
      id: "missed_lead_rescue",
      title: "Missed Lead Rescue",
      audience: "Client business",
      promise: "Protect the hotel from silent WhatsApp enquiries when staff are busy.",
      trigger: "Guest message is unanswered for more than 10 minutes.",
      liveSignal: `${missedCount} lead${missedCount === 1 ? "" : "s"} currently need attention`,
      activeCount: missedCount,
      nextAction: missedCount ? "Open Inbox and clear the unanswered queue before sending more campaigns." : "Submit missed_enquiry_rescue_v1 for approval before live client use.",
      impact: "Shows the hotel owner the value of never letting a direct booking lead go cold.",
      templates: [
        template("missed_enquiry_rescue_v1", "UTILITY", "Holding reply when staff miss SLA"),
        template("specialist_callback_v1", "UTILITY", "Escalate serious enquiries to a person")
      ],
      steps: [
        { title: "Watch SLA", description: "AiFrogi checks whether the last message is from the guest and how long it has waited.", owner: "AiFrogi", timing: "Every few minutes" },
        { title: "Send holding reply", description: "Guest gets confirmation and is asked for dates, guests, and room preference.", owner: "Meta", timing: "After 10 minutes" },
        { title: "Alert staff", description: "Lead moves to urgent queue with a clear next action.", owner: "AiFrogi", timing: "Same time" },
        { title: "Escalate hot leads", description: "High-score or callback requests are marked for human follow-up.", owner: "Staff", timing: "Same day" }
      ]
    },
    {
      id: "review_repeat_guest",
      title: "Review And Repeat Guest Loop",
      audience: "Client business",
      promise: "Turn stays into reviews, reputation, and repeat revenue.",
      trigger: "Lead is booked, checkout date passes, or staff marks stay completed.",
      liveSignal: `${reviewCount} booked/review-related lead${reviewCount === 1 ? "" : "s"} available`,
      activeCount: reviewCount,
      nextAction: reviewCount ? "Send review request to completed stays." : "Demo this with a booked sample lead after templates approve.",
      impact: "Moves AiFrogi beyond acquisition into customer lifecycle automation.",
      templates: [
        template("review_request_v1", "UTILITY", "Ask for feedback or review after stay")
      ],
      steps: [
        { title: "Detect checkout", description: "Stay completion or booked stage makes the lead eligible.", owner: "AiFrogi", timing: "After checkout" },
        { title: "Ask for feedback", description: "Happy guests get review link; unhappy guests can be escalated privately.", owner: "AI", timing: "Same day" },
        { title: "Create repeat segment", description: "Past guests can later receive seasonal or direct booking offers.", owner: "AiFrogi", timing: "30-60 days" }
      ]
    },
    {
      id: "manager_daily_digest",
      title: "Owner Daily Digest",
      audience: "Both",
      promise: "Give the hotel owner one calm morning summary instead of scattered chats and missed tasks.",
      trigger: "Every morning at the hotel’s chosen time.",
      liveSignal: `${hotCount} hot or priority item${hotCount === 1 ? "" : "s"} can feed today’s summary`,
      activeCount: hotCount,
      nextAction: "Use this as the premium AiFrogi demo after manager_daily_digest_v1 is approved.",
      impact: "Positions AiFrogi as an operating system, not a chatbot.",
      templates: [
        template("manager_daily_digest_v1", "UTILITY", "Daily WhatsApp summary for owner or manager")
      ],
      steps: [
        { title: "Summarize pipeline", description: "New enquiries, hot leads, pending quotes, follow-ups, reviews, and top action.", owner: "AI", timing: "Daily" },
        { title: "Send owner summary", description: "Owner receives one WhatsApp digest with dashboard link.", owner: "Meta", timing: "9 AM" },
        { title: "Prioritize the day", description: "Staff can start with the highest-value action instead of scanning all chats.", owner: "Staff", timing: "Morning" }
      ]
    }
  ];
}

export function getWorkflowReadiness(workflows: AutomationWorkflow[]) {
  const templates = workflows.flatMap((workflow) => workflow.templates);
  const unique = Array.from(new Map(templates.map((item) => [item.name, item])).values());
  const approved = unique.filter((item) => item.status === "approved").length;
  const pending = unique.filter((item) => item.status === "pending").length;
  const notSubmitted = unique.filter((item) => item.status === "not_submitted").length;

  return {
    total: unique.length,
    approved,
    pending,
    notSubmitted,
    completionPercent: unique.length ? Math.round((approved / unique.length) * 100) : 0
  };
}
