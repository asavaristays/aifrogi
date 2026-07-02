export const WHATSAPP_BOT_SERVICE_OPTIONS = [
  { key: "WEBSITE_CMS", label: "Website, CMS and hosting", menuLabel: "Website & CMS", prompt: "I want information about website, CMS and hosting." },
  { key: "SEO_DIRECT_BOOKING", label: "SEO and online visibility", menuLabel: "SEO & Online Growth", prompt: "I want to improve SEO and online visibility." },
  { key: "WHATSAPP_AUTOMATION", label: "WhatsApp lead automation", menuLabel: "WhatsApp Automation", prompt: "I want to automate WhatsApp leads and follow-ups." },
  { key: "AI_AUTOMATION", label: "AI replies and follow-ups", menuLabel: "AI Tools", prompt: "I want information about AI replies, lead scoring and follow-ups." },
  { key: "CONSULTATION_INTEGRATIONS", label: "Booking, payment and business integrations", menuLabel: "Business Integrations", prompt: "I want to discuss booking, payment or business integrations." }
] as const;

export type WhatsAppBotServiceKey = (typeof WHATSAPP_BOT_SERVICE_OPTIONS)[number]["key"];

export type WhatsAppBotMenuOption = {
  id: string;
  label: string;
  description: string;
  prompt: string;
};

export type WhatsAppBotConfiguration = {
  enabled: boolean;
  language: "EN";
  welcomeEnabled: boolean;
  welcomeMessage: string;
  serviceBuckets: WhatsAppBotServiceKey[];
  auditEnabled: boolean;
  trialEnabled: boolean;
  humanHandoffEnabled: boolean;
  collectLeadDetails: boolean;
};

export type WhatsAppBotConfigurationInput = Partial<Omit<WhatsAppBotConfiguration, "language" | "serviceBuckets">> & {
  language?: string;
  serviceBuckets?: string[];
};

export const DEFAULT_WHATSAPP_BOT_WELCOME = "Thank you for contacting HotelRADAR AI Agency. I can help you choose the right website, WhatsApp automation, AI audit, or 30-day trial path.";

export const DEFAULT_WHATSAPP_BOT_CONFIGURATION: WhatsAppBotConfiguration = {
  enabled: true,
  language: "EN",
  welcomeEnabled: true,
  welcomeMessage: DEFAULT_WHATSAPP_BOT_WELCOME,
  serviceBuckets: WHATSAPP_BOT_SERVICE_OPTIONS.map((option) => option.key),
  auditEnabled: true,
  trialEnabled: true,
  humanHandoffEnabled: true,
  collectLeadDetails: true
};

export function normalizeWhatsAppBotConfiguration(value?: WhatsAppBotConfigurationInput | null): WhatsAppBotConfiguration {
  const allowed = new Set<string>(WHATSAPP_BOT_SERVICE_OPTIONS.map((option) => option.key));
  const selected = Array.isArray(value?.serviceBuckets)
    ? value.serviceBuckets.filter((key): key is WhatsAppBotServiceKey => allowed.has(key))
    : DEFAULT_WHATSAPP_BOT_CONFIGURATION.serviceBuckets;

  return {
    enabled: value?.enabled ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.enabled,
    language: "EN",
    welcomeEnabled: value?.welcomeEnabled ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.welcomeEnabled,
    welcomeMessage: value?.welcomeMessage?.trim() || DEFAULT_WHATSAPP_BOT_WELCOME,
    serviceBuckets: selected,
    auditEnabled: value?.auditEnabled ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.auditEnabled,
    trialEnabled: value?.trialEnabled ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.trialEnabled,
    humanHandoffEnabled: value?.humanHandoffEnabled ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.humanHandoffEnabled,
    collectLeadDetails: value?.collectLeadDetails ?? DEFAULT_WHATSAPP_BOT_CONFIGURATION.collectLeadDetails
  };
}

export function buildWhatsAppBotMenuOptions(configuration: WhatsAppBotConfiguration): WhatsAppBotMenuOption[] {
  const options: WhatsAppBotMenuOption[] = WHATSAPP_BOT_SERVICE_OPTIONS
    .filter((option) => configuration.serviceBuckets.includes(option.key))
    .map((option) => ({
      id: `menu_${option.key.toLowerCase()}`,
      label: option.menuLabel,
      description: option.label,
      prompt: option.prompt
    }));

  if (configuration.auditEnabled) {
    options.push({
      id: "menu_website_audit",
      label: "AI Website Audit",
      description: "Review visibility, conversion and trust gaps",
      prompt: "I want an AI Audit of my website and enquiry process."
    });
  }

  if (configuration.trialEnabled) {
    options.push({
      id: "menu_trial",
      label: "30-Day Trial",
      description: "Explore a working automation trial",
      prompt: "I want information about the 30-day working trial."
    });
  }

  if (configuration.humanHandoffEnabled) {
    options.push({
      id: "menu_human",
      label: "Talk to a Specialist",
      description: "Request a callback from the team",
      prompt: "I would like to talk to a human specialist."
    });
  }

  return options.slice(0, 10);
}
