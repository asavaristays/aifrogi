export type BotReadinessCheck = { key: string; label: string; complete: boolean; detail: string; href: string };

type Profile = { category?: string | null; personaPackVersion?: string | null; operatingMode?: string | null; channels?: readonly string[]; capabilities?: readonly string[]; humanHandoffEnabled?: boolean | null; actionApprovalNeeded?: boolean | null; personaName?: string | null; businessObjective?: string | null; tone?: string | null; languages?: readonly string[]; prohibitedClaims?: readonly string[]; escalationTriggers?: readonly string[]; status?: string | null };
type Connector = { name: string; required: boolean; enabled: boolean; lifecycle: string };

export function evaluateBotReadiness(input: {
  profile?: Profile | null;
  businessVerified: boolean;
  approvedKnowledgeCount: number;
  websitePageCount: number;
  whatsappConnected: boolean;
  connectors?: readonly Connector[];
}) {
  const profile = input.profile;
  const channels = profile?.channels || [];
  const usesWebsite = channels.includes("WEBSITE");
  const usesWhatsApp = channels.includes("WHATSAPP");
  const knowledgeCount = input.approvedKnowledgeCount + input.websitePageCount;
  const actionMode = profile?.operatingMode === "APPROVED_ACTIONS" || profile?.operatingMode === "HUMAN_APPROVAL";
  const requiredConnectors = (input.connectors || []).filter((connector) => connector.required);
  const connectorReady = requiredConnectors.every((connector) => connector.enabled && ["LIVE", "MONITORED"].includes(connector.lifecycle));
  const checks: BotReadinessCheck[] = [
    { key: "blueprint", label: "Bot blueprint", complete: profile?.status === "CONFIGURED", detail: profile?.status === "CONFIGURED" ? `${profile.category?.replaceAll("_", " ")} configured` : "SuperAdmin must select the category, channels and authority", href: "/onboarding" },
    { key: "persona", label: "Governed persona", complete: Boolean(profile?.personaPackVersion && profile?.personaName && profile?.businessObjective && profile?.tone && profile?.languages?.length), detail: profile?.personaName ? `${profile.personaName} · pack v${profile.personaPackVersion || "pending"}` : "Persona name, objective, tone and languages required", href: "/onboarding" },
    { key: "business", label: "Business verification", complete: input.businessVerified, detail: input.businessVerified ? "Business details approved" : "Business review is incomplete", href: "/onboarding" },
    { key: "knowledge", label: "Approved intelligence", complete: knowledgeCount > 0, detail: knowledgeCount ? `${knowledgeCount} approved source item${knowledgeCount === 1 ? "" : "s"}` : "Approve a website page, document, CSV row set, or manual answer", href: "/knowledge" },
    { key: "safety", label: "Safety and escalation", complete: Boolean(profile?.humanHandoffEnabled && profile?.prohibitedClaims?.length && profile?.escalationTriggers?.length), detail: profile?.humanHandoffEnabled ? "Claims and escalation boundaries required" : "Human handoff must be enabled", href: "/onboarding" },
    { key: "channels", label: "Customer channels", complete: (!usesWebsite || knowledgeCount > 0) && (!usesWhatsApp || input.whatsappConnected), detail: usesWhatsApp && !input.whatsappConnected ? "WhatsApp connection required" : usesWebsite || usesWhatsApp ? "Configured channels have an operating path" : "Select at least one channel", href: usesWhatsApp ? "/setup" : "/knowledge" },
    { key: "authority", label: "Action authority", complete: !actionMode || Boolean(profile?.actionApprovalNeeded), detail: actionMode ? "Business actions require approval or verified tool authority" : "No autonomous business action enabled", href: "/onboarding" },
    { key: "connectors", label: "Connector readiness", complete: !actionMode || (requiredConnectors.length > 0 && connectorReady), detail: !actionMode ? "No connector-backed action authority enabled" : !requiredConnectors.length ? "Category connector plan must be generated" : connectorReady ? `${requiredConnectors.length} required connector${requiredConnectors.length === 1 ? "" : "s"} live` : `${requiredConnectors.filter((connector)=>!connector.enabled || !["LIVE","MONITORED"].includes(connector.lifecycle)).map((connector)=>connector.name).join(", ")} not live`, href: "/onboarding" }
  ];
  const completed = checks.filter((check) => check.complete).length;
  return { checks, completed, total: checks.length, percent: Math.round((completed / checks.length) * 100), ready: completed === checks.length };
}
