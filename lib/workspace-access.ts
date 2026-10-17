type WorkspaceAccessOrganization = {
  status?: string | null;
  onboarding?: { lifecycleStatus?: string | null } | null;
  botProfile?: { channels?: string[]; status?: string | null } | null;
};

const APPROVED_WORKSPACE_STATES = new Set(["LIVE", "PAUSED"]);

export function canOpenClientWorkspace(
  organization: WorkspaceAccessOrganization | null | undefined,
  membership?: { role?: string | null; status?: string | null } | null
) {
  if (!organization) return false;
  if (organization.onboarding?.lifecycleStatus === "LIVE") return true;
  const websiteBot = organization.botProfile?.channels?.includes("WEBSITE");
  if (websiteBot && APPROVED_WORKSPACE_STATES.has(organization.botProfile?.status || "")) return true;
  // Private preparation access is separate from permission to serve guests.
  return Boolean(
    organization.status === "ONBOARDING" && websiteBot &&
    organization.botProfile?.status === "REVIEW_PENDING" &&
    membership?.status === "ACTIVE" &&
    (membership.role === "OWNER" || membership.role === "ADMIN")
  );
}
