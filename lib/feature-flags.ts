function enabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() || "");
}

function listed(value: string | undefined, candidate: string) {
  const normalized = candidate.trim().toLowerCase();
  if (!normalized) return false;
  return (value || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalized);
}

export const featureFlags = {
  get channelCore() {
    return enabled(process.env.AIFROGI_CHANNEL_CORE_ENABLED);
  },
  get channelShadowWrite() {
    return enabled(process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED);
  },
  channelShadowWriteForWorkspace(workspaceSlug: string) {
    return this.channelCore
      && this.channelShadowWrite
      && listed(process.env.AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS, workspaceSlug);
  },
  get channelNeutralRead() {
    return enabled(process.env.AIFROGI_CHANNEL_NEUTRAL_READ_ENABLED);
  },
  get websiteChannel() {
    return enabled(process.env.AIFROGI_WEBSITE_CHANNEL_ENABLED);
  },
  get agentOperations() {
    return enabled(process.env.AIFROGI_AGENT_OPERATIONS_ENABLED);
  }
};
