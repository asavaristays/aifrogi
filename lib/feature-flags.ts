function enabled(value: string | undefined) {
  return ["1", "true", "yes", "on"].includes(value?.trim().toLowerCase() || "");
}

export const featureFlags = {
  get channelCore() {
    return enabled(process.env.AIFROGI_CHANNEL_CORE_ENABLED);
  },
  get channelShadowWrite() {
    return enabled(process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED);
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

