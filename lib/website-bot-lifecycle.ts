export const WEBSITE_BOT_STATUSES = ["DRAFT", "INSTALLATION_READY", "INSTALLATION_DETECTED", "REVIEW_PENDING", "LIVE", "PAUSED", "DELETED"] as const;
export type WebsiteBotStatus = typeof WEBSITE_BOT_STATUSES[number];
export type WebsiteBotLifecycleAction = "MAKE_LIVE" | "PAUSE" | "DELETE" | "RESTORE";

export function statusAfterBotProfileSave(status: string | null | undefined, installationDetected: boolean, materiallyChanged: boolean): WebsiteBotStatus {
  if (status === "LIVE" || status === "PAUSED" || status === "DELETED") return status;
  if (status === "REVIEW_PENDING" && !materiallyChanged) return "REVIEW_PENDING";
  if (status === "INSTALLATION_DETECTED") return "INSTALLATION_DETECTED";
  return installationDetected ? "INSTALLATION_DETECTED" : "INSTALLATION_READY";
}

export function canServeWebsiteBot(status: string, channels: readonly string[]) {
  return channels.includes("WEBSITE") && status === "LIVE";
}

export function nextWebsiteBotStatus(status: string, action: WebsiteBotLifecycleAction, installationDetected: boolean): WebsiteBotStatus {
  if (action === "MAKE_LIVE") {
    if (status === "DELETED") throw new Error("Restore the bot before requesting approval.");
    return "LIVE";
  }
  if (action === "PAUSE") return "PAUSED";
  if (action === "DELETE") return "DELETED";
  return installationDetected ? "INSTALLATION_DETECTED" : "INSTALLATION_READY";
}
