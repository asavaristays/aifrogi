type WorkspaceAccessOrganization = {
  onboarding?: { lifecycleStatus?: string | null } | null;
  botProfile?: { channels?: string[]; status?: string | null } | null;
};

const APPROVED_WORKSPACE_STATES = new Set(["LIVE", "PAUSED"]);

export function canOpenClientWorkspace(organization: WorkspaceAccessOrganization | null | undefined) {
  if (!organization) return false;
  if (organization.onboarding?.lifecycleStatus === "LIVE") return true;
  return Boolean(
    organization.botProfile?.channels?.includes("WEBSITE") &&
    APPROVED_WORKSPACE_STATES.has(organization.botProfile.status || "")
  );
}
