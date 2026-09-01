type WorkspaceAccessOrganization = {
  onboarding?: { lifecycleStatus?: string | null } | null;
  botProfile?: { channels?: string[]; status?: string | null } | null;
};

const WEBSITE_PREPARATION_STATES = new Set([
  "INSTALLATION_READY",
  "INSTALLATION_DETECTED",
  "CONFIGURED",
  "LIVE",
  "PAUSED"
]);

export function canOpenClientWorkspace(organization: WorkspaceAccessOrganization | null | undefined) {
  if (!organization) return false;
  if (organization.onboarding?.lifecycleStatus === "LIVE") return true;
  return Boolean(
    organization.botProfile?.channels?.includes("WEBSITE") &&
    WEBSITE_PREPARATION_STATES.has(organization.botProfile.status || "")
  );
}
