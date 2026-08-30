export const WEBSITE_BOT_STATUSES = ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED", "LIVE", "PAUSED", "DELETED"] as const;
export type WebsiteBotStatus = typeof WEBSITE_BOT_STATUSES[number];
export type WebsiteBotLifecycleAction = "MAKE_LIVE" | "PAUSE" | "DELETE" | "RESTORE";

export function canServeWebsiteBot(status: string, channels: readonly string[]) {
  return channels.includes("WEBSITE") && ["CONFIGURED", "LIVE"].includes(status);
}

export function nextWebsiteBotStatus(status: string, action: WebsiteBotLifecycleAction, installationDetected: boolean): WebsiteBotStatus {
  if (action === "MAKE_LIVE") {
    if (!installationDetected) throw new Error("Install the code on the customer website before making the bot live.");
    return "LIVE";
  }
  if (action === "PAUSE") return "PAUSED";
  if (action === "DELETE") return "DELETED";
  return installationDetected ? "INSTALLATION_DETECTED" : "INSTALLATION_READY";
}
