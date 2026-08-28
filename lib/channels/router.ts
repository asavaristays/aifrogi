import type { ChannelConnectionRef, SendMessageInput, SendStructuredMessageInput } from "@/lib/channels/contracts";
import type { ChannelRegistry } from "@/lib/channels/registry";

function assertWorkspaceOwnsConnection(workspaceId: string, connection: ChannelConnectionRef) {
  if (!workspaceId || workspaceId !== connection.workspaceId) {
    throw new Error("Cross-workspace channel access rejected");
  }
  if (!connection.enabled) {
    throw new Error("Channel connection is disabled");
  }
}

export class ChannelRouter {
  constructor(private readonly registry: ChannelRegistry) {}

  async sendMessage(input: SendMessageInput) {
    assertWorkspaceOwnsConnection(input.workspaceId, input.connection);
    const adapter = this.registry.get(input.connection.kind);
    const policy = await adapter.validateOutboundPolicy(input);
    if (!policy.allowed) {
      return {
        accepted: false,
        deliveryState: "FAILED" as const,
        errorCode: "POLICY_REJECTED",
        errorMessage: policy.reason || "Outbound policy rejected the message"
      };
    }
    return adapter.sendMessage(input);
  }

  async sendStructuredMessage(input: SendStructuredMessageInput) {
    assertWorkspaceOwnsConnection(input.workspaceId, input.connection);
    const adapter = this.registry.get(input.connection.kind);
    const policy = await adapter.validateOutboundPolicy(input);
    if (!policy.allowed) {
      return {
        accepted: false,
        deliveryState: "FAILED" as const,
        errorCode: "POLICY_REJECTED",
        errorMessage: policy.reason || "Outbound policy rejected the message"
      };
    }
    return adapter.sendStructuredMessage(input);
  }
}

