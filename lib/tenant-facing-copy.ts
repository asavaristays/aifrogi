const LEGACY_GENERIC_WELCOMES = new Set([
  "hello. how can i help with your business enquiry today?",
  "welcome. how can i help with your business enquiry today?"
]);

export function resolveTenantWelcomeMessage(input: {
  configuredMessage: string;
  businessName: string;
  hotelMode: boolean;
}) {
  const configured = input.configuredMessage.trim();
  if (!input.hotelMode || !LEGACY_GENERIC_WELCOMES.has(configured.toLowerCase())) return configured;
  return `Welcome to ${input.businessName}. How can I help you plan your stay?`;
}

export function suggestedInboxReply(input: {
  businessName: string;
  hotelMode: boolean;
  journey: "pre-stay" | "in-stay";
  whatsappEnabled: boolean;
  source: string;
}) {
  if (input.hotelMode && input.journey === "in-stay") {
    return "Thank you. The front desk has received your request. We’ll coordinate with the right hotel team and update you here as soon as work begins.";
  }
  if (input.hotelMode) {
    return `Thanks for contacting ${input.businessName}. Please share your preferred stay dates, number of guests, and cottage preference. I’ll use this hotel’s approved information and involve the reservations team whenever confirmation is required.`;
  }
  if (!input.whatsappEnabled) {
    return `Thanks for reaching out. Please share the result you want to achieve and any important requirement. I’ll use ${input.businessName}'s approved information and involve the team when judgment is required.`;
  }
  if (input.source === "AI audit") {
    return "Thanks for your interest in the AI audit. Please share your hotel name, website, city, and current booking channels. I will review visibility, conversion gaps, and WhatsApp follow-up opportunities.";
  }
  if (input.source === "Trial") {
    return "Thanks for your interest in the 15-day trial. Please share your business name, website, WhatsApp number, and the workflow you want to improve first.";
  }
  return "Thanks for reaching out. Please share your business name, website, current tools, and the result you want to achieve so we can guide the next step.";
}
