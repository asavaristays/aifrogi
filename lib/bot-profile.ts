import { requiredCapabilitiesForCategory } from "@/lib/bot-persona-packs";

export const BOT_CATEGORIES = ["BUSINESS_AI", "PINGBOOK", "FLOWCART", "STAY", "RESTAURANT", "REAL_ESTATE", "EDUCATION", "CUSTOM"] as const;
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
  personaName: string;
  businessObjective: string;
  tone: string;
  languages: string[];
  prohibitedClaims: string[];
  escalationTriggers: string[];
  responseSlaMinutes: number;
  reminderPercent: number;
  fallbackEnabled: boolean;
  safeFallbackMessage: string;
};

export function normalizeCapabilitiesForCategory(
  category: BotProfileInput["category"],
  capabilities: readonly string[]
) {
  const supported = capabilities.filter((capability): capability is BotProfileInput["capabilities"][number] =>
    BOT_CAPABILITIES.includes(capability as BotProfileInput["capabilities"][number])
  );
  return [...new Set([...supported, ...requiredCapabilitiesForCategory(category)])];
}

function text(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function list(value: unknown, fallback: string[] = []) {
  const values = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\r?\n|,/) : fallback;
  return [...new Set(values.map((item) => text(item, 160)).filter(Boolean))].slice(0, 30);
}

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
  const requiredCapabilities = requiredCapabilitiesForCategory(category as BotProfileInput["category"]);
  const missingCapabilities = requiredCapabilities.filter((capability) => !capabilities.includes(capability));
  const missingActionCapabilities = missingCapabilities.filter((capability) => capability === "BOOK_APPOINTMENTS" || capability === "CREATE_ORDERS");
  if (missingActionCapabilities.length) return { error: `${category.replaceAll("_", " ")} requires ${missingActionCapabilities.map((capability)=>capability === "BOOK_APPOINTMENTS" ? "appointment booking" : "order creation").join(", ")} capability` };
  const personaName = text(input.personaName, 80);
  const businessObjective = text(input.businessObjective, 1000);
  const tone = text(input.tone, 160) || "Professional, clear and helpful";
  const languages = list(input.languages, ["English"]);
  const responseSlaMinutes = Math.min(24 * 60, Math.max(5, Math.round(Number(input.responseSlaMinutes) || 60)));
  const reminderPercent = Math.min(90, Math.max(10, Math.round(Number(input.reminderPercent) || 50)));
  const safeFallbackMessage = text(input.safeFallbackMessage, 600);
  if (!personaName) return { error: "Give this bot a customer-facing persona name" };
  if (!businessObjective) return { error: "Describe the bot's business objective" };
  if (!languages.length) return { error: "Select at least one supported language" };
  if (missingCapabilities.length) return { error: `${category.replaceAll("_", " ")} requires ${missingCapabilities.map((capability)=>capability.toLowerCase().replaceAll("_", " ")).join(", ")} capability` };
  if (input.fallbackEnabled === true && safeFallbackMessage.length < 20) return { error: "Add approved safe fallback wording before enabling fallback" };
  return { value: { category: category as BotProfileInput["category"], operatingMode: operatingMode as BotProfileInput["operatingMode"], channels: channels as BotProfileInput["channels"], capabilities: capabilities as BotProfileInput["capabilities"], humanHandoffEnabled: input.humanHandoffEnabled !== false, actionApprovalNeeded: input.actionApprovalNeeded !== false, personaName, businessObjective, tone, languages, prohibitedClaims: list(input.prohibitedClaims), escalationTriggers: list(input.escalationTriggers), responseSlaMinutes, reminderPercent, fallbackEnabled: input.fallbackEnabled === true, safeFallbackMessage } };
}
