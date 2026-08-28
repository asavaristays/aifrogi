import type { ChannelAdapter, ChannelKind } from "@/lib/channels/contracts";

export class ChannelRegistry {
  private readonly adapters = new Map<ChannelKind, ChannelAdapter>();

  register(adapter: ChannelAdapter) {
    if (this.adapters.has(adapter.kind)) {
      throw new Error(`Channel adapter already registered: ${adapter.kind}`);
    }
    this.adapters.set(adapter.kind, adapter);
    return this;
  }

  get(kind: ChannelKind) {
    const adapter = this.adapters.get(kind);
    if (!adapter) throw new Error(`Channel adapter is not registered: ${kind}`);
    return adapter;
  }

  list() {
    return Array.from(this.adapters.keys());
  }
}

