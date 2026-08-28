export const BOT_CATEGORIES = ["BUSINESS_AI", "PINGBOOK", "FLOWCART", "STAY", "CUSTOM"] as const;
export const BOT_OPERATING_MODES = ["ANSWER_ONLY", "LEAD_CAPTURE", "APPROVED_ACTIONS", "HUMAN_APPROVAL"] as const;
export const BOT_CHANNELS = ["WEBSITE", "WHATSAPP"] as const;
export const BOT_CAPABILITIES = ["ANSWER_QUESTIONS", "CAPTURE_LEADS", "QUALIFY_LEADS", "BOOK_APPOINTMENTS", "CREATE_ORDERS"] as const;

export type BotProfileInput = {
  category: typeof BOT_CATEGORIES[number];
  operatingMode: typeof BOT_OPERATING_MODES[number];
  channels: Array<typeof BOT_CHANNELS[number]>;
  capabilities: Array<typeof BOT_CAPABILITIES[number]>;
  humanHandoffEnabled: boolean;
  actionApprovalNeeded: boolean;
};

export function parseBotProfile(value: unknown): { value?: BotProfileInput; error?: string } {
  if (!value || typeof value !== "object") return { error: "Bot profile is required" };
  const input = value as Record<string, unknown>;
  const category = String(input.category || "").toUpperCase();
  const operatingMode = String(input.operatingMode || "").toUpperCase();
  const channels = Array.isArray(input.channels) ? [...new Set(input.channels.map((item) => String(item).toUpperCase()))] : [];
  const capabilities = Array.isArray(input.capabilities) ? [...new Set(input.capabilities.map((item) => String(item).toUpperCase()))] : [];
  if (!BOT_CATEGORIES.includes(category as BotProfileInput["category"])) return { error: "Select a valid bot category" };
  if (!BOT_OPERATING_MODES.includes(operatingMode as BotProfileInput["operatingMode"])) return { error: "Select a valid operating mode" };
  if (!channels.length || channels.some((item) => !BOT_CHANNELS.includes(item as BotProfileInput["channels"][number]))) return { error: "Select at least one supported channel" };
  if (!capabilities.length || capabilities.some((item) => !BOT_CAPABILITIES.includes(item as BotProfileInput["capabilities"][number]))) return { error: "Select at least one supported capability" };
  if (category === "PINGBOOK" && !capabilities.includes("BOOK_APPOINTMENTS")) return { error: "PingBook requires appointment booking capability" };
  if (category === "FLOWCART" && !capabilities.includes("CREATE_ORDERS")) return { error: "FlowCart requires order creation capability" };
  return { value: { category: category as BotProfileInput["category"], operatingMode: operatingMode as BotProfileInput["operatingMode"], channels: channels as BotProfileInput["channels"], capabilities: capabilities as BotProfileInput["capabilities"], humanHandoffEnabled: input.humanHandoffEnabled !== false, actionApprovalNeeded: input.actionApprovalNeeded !== false } };
}
