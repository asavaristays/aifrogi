import { BOT_BLUEPRINTS, getBotBlueprint } from "@/lib/bot-blueprints";
import type { BotProfileInput } from "@/lib/bot-profile";

export const CATEGORY_BLUEPRINT_VERSION = "1.0" as const;

export function getVersionedBotBlueprint(category: BotProfileInput["category"]) {
  return { version: CATEGORY_BLUEPRINT_VERSION, category, blueprint: getBotBlueprint(category) };
}

export function listVersionedBotBlueprints() {
  return Object.entries(BOT_BLUEPRINTS).map(([category, blueprint]) => ({ version: CATEGORY_BLUEPRINT_VERSION, category: category as BotProfileInput["category"], blueprint }));
}
