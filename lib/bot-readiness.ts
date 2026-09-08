export type BotReadinessCheck = { key: string; label: string; complete: boolean; detail: string; href: string };

type Profile = { category?: string | null; personaPackVersion?: string | null; operatingMode?: string | null; channels?: readonly string[]; capabilities?: readonly string[]; humanHandoffEnabled?: boolean | null; actionApprovalNeeded?: boolean | null; personaName?: string | null; businessObjective?: string | null; tone?: string | null; languages?: readonly string[]; prohibitedClaims?: readonly string[]; escalationTriggers?: readonly string[]; status?: string | null };
type Connector = { name: string; required: boolean; enabled: boolean; lifecycle: string };

export function evaluateBotReadiness(input: {
  profile?: Profile | null;
  appearanceConfigured: boolean;
  approvedKnowledgeCount: number;
  websitePageCount: number;
  testComplete: boolean;
  installationComplete: boolean;
  connectors?: readonly Connector[];
}) {
  const profile = input.profile;
  const channels = profile?.channels || [];
  const usesWebsite = channels.includes("WEBSITE");
  const knowledgeCount = input.approvedKnowledgeCount + input.websitePageCount;
  const actionMode = profile?.operatingMode === "APPROVED_ACTIONS" || profile?.operatingMode === "HUMAN_APPROVAL";
  const requiredConnectors = (input.connectors || []).filter((connector) => connector.required);
  const connectorReady = requiredConnectors.every((connector) => connector.enabled && ["LIVE", "MONITORED"].includes(connector.lifecycle));
  const checks: BotReadinessCheck[] = [
    { key: "blueprint", label: "Website bot", complete: Boolean(profile && usesWebsite && ["CONFIGURED", "INSTALLATION_READY", "INSTALLATION_DETECTED", "LIVE", "PAUSED"].includes(profile.status || "")), detail: profile ? `${profile.category?.replaceAll("_", " ")} · ${String(profile.status || "draft").replaceAll("_", " ").toLowerCase()}` : "Website bot setup is required", href: "/setup" },
    { key: "appearance", label: "Appearance", complete: input.appearanceConfigured, detail: input.appearanceConfigured ? "Name, welcome message and theme are ready" : "Complete the bot appearance", href: "/setup#bot-appearance" },
    { key: "persona", label: "Persona intelligence", complete: Boolean(profile?.personaPackVersion && profile?.personaName && profile?.businessObjective && profile?.tone && profile?.languages?.length), detail: profile?.personaName ? `${profile.personaName} · pack v${profile.personaPackVersion || "pending"}` : "Name, purpose, tone and languages required", href: "/setup#bot-behaviour" },
    { key: "knowledge", label: "Approved intelligence", complete: knowledgeCount > 0, detail: knowledgeCount ? `${knowledgeCount} approved source item${knowledgeCount === 1 ? "" : "s"}` : "Approve a website page, document, CSV row set, or manual answer", href: "/knowledge" },
    { key: "safety", label: "Safety and escalation", complete: Boolean(profile?.humanHandoffEnabled && profile?.prohibitedClaims?.length && profile?.escalationTriggers?.length), detail: profile?.humanHandoffEnabled ? "Claims and escalation boundaries required" : "Human handoff must be enabled", href: "/setup#bot-behaviour" },
    { key: "test", label: "Customer-question test", complete: input.testComplete, detail: input.testComplete ? "A website-bot answer test is recorded" : "Test a real customer question", href: "/knowledge#test-your-bot" },
    { key: "installation", label: "Website installation", complete: input.installationComplete, detail: input.installationComplete ? "Installation evidence is recorded" : "Install and detect the website widget", href: "/setup#website-installation" },
    { key: "authority", label: "Action authority", complete: !actionMode || Boolean(profile?.actionApprovalNeeded), detail: actionMode ? "Business actions require approval or verified tool authority" : "No autonomous business action enabled", href: "/setup#bot-behaviour" },
    { key: "connectors", label: "Connector readiness", complete: !actionMode || (requiredConnectors.length > 0 && connectorReady), detail: !actionMode ? "No connector-backed action authority enabled" : !requiredConnectors.length ? "Category connector plan must be generated" : connectorReady ? `${requiredConnectors.length} required connector${requiredConnectors.length === 1 ? "" : "s"} live` : `${requiredConnectors.filter((connector)=>!connector.enabled || !["LIVE","MONITORED"].includes(connector.lifecycle)).map((connector)=>connector.name).join(", ")} not live`, href: "/support" }
  ];
  const completed = checks.filter((check) => check.complete).length;
  return { checks, completed, total: checks.length, percent: Math.round((completed / checks.length) * 100), ready: completed === checks.length };
}
