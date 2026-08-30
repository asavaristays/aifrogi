import type { Lead } from "@/types";
import {
  DEFAULT_WHATSAPP_BOT_CONFIGURATION,
  WHATSAPP_BOT_SERVICE_OPTIONS,
  buildWhatsAppBotMenuOptions,
  type WhatsAppBotConfiguration,
  type WhatsAppBotServiceKey
} from "@/lib/whatsapp-bot-config";

const AUTO_REPLY_COOLDOWN_MS = 2 * 60 * 1000;

export type AgencyInquiryBucket =
  | "TEST_MESSAGE"
  | "WEBSITE_CMS"
  | "SEO_DIRECT_BOOKING"
  | "WHATSAPP_AUTOMATION"
  | "AI_AUTOMATION"
  | "PRICING_TRIAL"
  | "WEBSITE_AUDIT"
  | "CONSULTATION_INTEGRATIONS";

export type AgencyInquiry = {
  bucket: AgencyInquiryBucket;
  label: string;
  tag: string;
  score: number;
  highPriority: boolean;
  reply: string;
  requiresHuman?: boolean;
};

function includesAny(message: string, terms: string[]) {
  return terms.some((term) => message.includes(term));
}

function serviceEnabled(configuration: WhatsAppBotConfiguration, service: WhatsAppBotServiceKey) {
  return configuration.serviceBuckets.includes(service);
}

function unavailableReply(configuration: WhatsAppBotConfiguration) {
  return configuration.humanHandoffEnabled
    ? "Thank you. I have noted your requirement. A specialist will confirm the suitable option for your business. Please share your name, business name, website, location, and preferred callback time."
    : "Thank you. This request needs a customised review. Please share your name, business name, website, location, and primary goal. Our team will review it."
}

export function buildWhatsAppFirstReply(configuration = DEFAULT_WHATSAPP_BOT_CONFIGURATION) {
  const capabilities: string[] = WHATSAPP_BOT_SERVICE_OPTIONS
    .filter((option) => configuration.serviceBuckets.includes(option.key))
    .map((option) => option.label);

  if (configuration.auditEnabled) capabilities.push("AI Audit of your website and enquiry process");
  if (configuration.trialEnabled) capabilities.push("15-day working trial");

  const numberedCapabilities = capabilities.map((label, index) => `${index + 1}. ${label}`).join("\n");
  const detailsPrompt = configuration.collectLeadDetails
    ? "\n\nTo guide you properly, share your business name, website, location, and the main result you want."
    : "";

  return `${configuration.welcomeMessage.trim()}\n\nI can help you with:\n${numberedCapabilities || "A customised digital growth consultation"}\n\nReply with a number or ask your question.${detailsPrompt}`;
}

export function classifyWhatsAppAgencyInquiry(
  message: string,
  configuration = DEFAULT_WHATSAPP_BOT_CONFIGURATION
): AgencyInquiry {
  const normalized = message.toLowerCase().replace(/\s+/g, " ").trim();
  const numberedChoice = normalized.match(/^(?:option\s*)?(\d+)$/)?.[1];
  if (numberedChoice) {
    const selected = buildWhatsAppBotMenuOptions(configuration)[Number(numberedChoice) - 1];
    if (selected) {
      return classifyWhatsAppAgencyInquiry(selected.prompt, configuration);
    }
  }

  if (includesAny(normalized, ["test", "testing", "check message", "checking bot", "health check", "trial message"])) {
    return {
      bucket: "TEST_MESSAGE",
      label: "WhatsApp test message",
      tag: "Test Message",
      score: 45,
      highPriority: false,
      reply: "Test received. HotelRADAR AI is connected and can help with website/CMS, SEO and online growth, WhatsApp automation, AI tools, business integrations, AI website audit, and the 15-day trial. Ask a question or reply with the area you want to check next."
    };
  }

  if (includesAny(normalized, ["audit", "analyse my site", "analyze my site", "website score", "site score", "check my website", "website review"])) {
    return configuration.auditEnabled ? {
      bucket: "WEBSITE_AUDIT",
      label: "AI website audit",
      tag: "Website Audit",
      score: 78,
      highPriority: true,
      reply: "Thank you for requesting the free HotelRADAR AI Audit. We review your hotel or villa website, WhatsApp enquiry path, SEO visibility, lead follow-up, and direct booking opportunities. No admin or payment access is needed.\n\nPlease share your business name, location, website URL, and main concern. Audit details: https://website.hotelradar.in/hotel-website-audit-goa/"
    } : {
      bucket: "WEBSITE_AUDIT",
      label: "Website audit enquiry",
      tag: "Audit Enquiry",
      score: 75,
      highPriority: true,
      reply: unavailableReply(configuration)
    };
  }

  if (includesAny(normalized, ["price", "pricing", "cost", "charges", "package", "plan", "trial", "demo", "quotation", "quote", "how much"])) {
    return configuration.trialEnabled ? {
      bucket: "PRICING_TRIAL",
      label: "Pricing and 15-day trial",
      tag: "Pricing & Trial",
      score: 82,
      highPriority: true,
      reply: "Thank you for your interest in the 15-day HotelRADAR trial. We can start without PMS, channel-manager, payment, or admin access.\n\nTo prepare your trial, please share:\n1. Property name and type\n2. Goa location\n3. Owner or manager name\n4. Mobile and WhatsApp number\n5. Email\n6. Existing website, Google Business, or Instagram link if available\n7. Booking engine or OTA link if available\n8. Primary goal: new website, direct bookings, Goa SEO, WhatsApp leads, booking engine, or AI tools\n9. Rooms/villas count and one short note on the main problem\n\nTrial details/form: https://website.hotelradar.in/#contact\nA HotelRADAR specialist can also call you from +91-7058963898. Reply STOP if you do not want further messages."
    } : {
      bucket: "PRICING_TRIAL",
      label: "Plan enquiry",
      tag: "Plan Enquiry",
      score: 78,
      highPriority: true,
      reply: unavailableReply(configuration)
    };
  }

  if (includesAny(normalized, ["whatsapp", "whatsapp api", "inbox", "chatbot", "lead capture", "broadcast", "campaign"])) {
    return serviceEnabled(configuration, "WHATSAPP_AUTOMATION") ? {
      bucket: "WHATSAPP_AUTOMATION",
      label: "WhatsApp lead automation",
      tag: "WhatsApp Automation",
      score: 76,
      highPriority: false,
      reply: "We can configure WhatsApp lead capture, shared inbox workflows, approved templates, automatic first replies, follow-ups, campaigns, and handoff to your team. Please share your business name, current WhatsApp setup, monthly enquiry volume, and the workflow you want to automate."
    } : {
      bucket: "WHATSAPP_AUTOMATION",
      label: "WhatsApp automation enquiry",
      tag: "WhatsApp Enquiry",
      score: 72,
      highPriority: false,
      reply: unavailableReply(configuration)
    };
  }

  if (includesAny(normalized, ["ai", "automation", "automate", "lead scoring", "reply generator", "follow-up", "follow up", "review reply", "openai", "crm"] )) {
    return serviceEnabled(configuration, "AI_AUTOMATION") ? {
      bucket: "AI_AUTOMATION",
      label: "AI tools and automation",
      tag: "AI & Automation",
      score: 74,
      highPriority: false,
      reply: "HotelRADAR provides practical AI tools for reply drafts, lead scoring, follow-ups, review replies, SEO content, and workflow automation. WhatsApp API, OpenAI, email, CRM, booking, and payment connections can be enabled after scope and access approval. Which workflow do you want to improve, and what tools are you using today?"
    } : {
      bucket: "AI_AUTOMATION",
      label: "AI automation enquiry",
      tag: "AI Enquiry",
      score: 72,
      highPriority: false,
      reply: unavailableReply(configuration)
    };
  }

  if (includesAny(normalized, ["seo", "google", "direct booking", "direct enquiry", "direct inquiry", "ota", "ranking", "traffic", "conversion", "locality", "leads", "marketing"])) {
    return serviceEnabled(configuration, "SEO_DIRECT_BOOKING") ? {
      bucket: "SEO_DIRECT_BOOKING",
      label: "SEO and online growth",
      tag: "SEO & Growth",
      score: 72,
      highPriority: false,
      reply: "We help improve online enquiries through local SEO pages, stronger WhatsApp paths, lead tracking, and conversion-focused content. Please share your website, location, and main goal: Google visibility, more direct leads, or better enquiry conversion."
    } : {
      bucket: "SEO_DIRECT_BOOKING",
      label: "SEO enquiry",
      tag: "SEO Enquiry",
      score: 68,
      highPriority: false,
      reply: unavailableReply(configuration)
    };
  }

  if (includesAny(normalized, ["website", "web site", "new site", "redesign", "revamp", "cms", "hosting", "domain", "ssl", "gallery", "web development", "web design", "landing page"])) {
    return serviceEnabled(configuration, "WEBSITE_CMS") ? {
      bucket: "WEBSITE_CMS",
      label: "Website, CMS and hosting",
      tag: "Website & CMS",
      score: 70,
      highPriority: false,
      reply: "We build premium, mobile-first websites with an editable CMS, secure hosting, SSL, image uploads, enquiry forms, action buttons, and WhatsApp lead capture. Please share your business name, type, location, current website if any, and whether you need a new website or an improvement."
    } : {
      bucket: "WEBSITE_CMS",
      label: "Website enquiry",
      tag: "Website Enquiry",
      score: 68,
      highPriority: false,
      reply: unavailableReply(configuration)
    };
  }

  const wantsHuman = includesAny(normalized, ["human", "agent", "person", "specialist", "call me", "phone call", "manager", "staff", "consult", "meeting", "speak"]);
  if (wantsHuman && !configuration.humanHandoffEnabled) {
    return {
      bucket: "CONSULTATION_INTEGRATIONS",
      label: "Support enquiry",
      tag: "Support Enquiry",
      score: 72,
      highPriority: false,
      reply: "Please share your name, business name, website, location, and your question. Our team will review the request."
    };
  }

  return serviceEnabled(configuration, "CONSULTATION_INTEGRATIONS") || wantsHuman ? {
    bucket: "CONSULTATION_INTEGRATIONS",
    label: "Consultation and integrations",
    tag: "Consultation",
    score: wantsHuman ? 80 : 60,
    highPriority: wantsHuman,
    reply: wantsHuman
      ? "Certainly. A HotelRADAR specialist can call you. Please share your name, business, location, current website, preferred callback time, and the best number to reach you."
      : "Please describe the business system or integration you need. Share your business name, website, current tools, and the result you want to achieve.",
    requiresHuman: wantsHuman
  } : {
    bucket: "CONSULTATION_INTEGRATIONS",
    label: "General business enquiry",
    tag: "General Enquiry",
    score: 60,
    highPriority: false,
    reply: unavailableReply(configuration)
  };
}

export function buildWhatsAppAutoReply(message: string) {
  return classifyWhatsAppAgencyInquiry(message).reply;
}

export function shouldSendWhatsAppAutoReply(lead: Lead, now = Date.now()) {
  const latestAiMessage = [...lead.transcript].reverse().find((message) => message.from === "ai");
  if (!latestAiMessage) return true;

  const lastReplyAt = Date.parse(latestAiMessage.sentAtIso);
  return !Number.isFinite(lastReplyAt) || now - lastReplyAt >= AUTO_REPLY_COOLDOWN_MS;
}
