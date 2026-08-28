import assert from "node:assert/strict";
import test from "node:test";
import type { ChannelSendResult, SendMessageInput, SendStructuredMessageInput } from "../../lib/channels/contracts";
import { ChannelRegistry } from "../../lib/channels/registry";
import { ChannelRouter } from "../../lib/channels/router";
import { WhatsAppChannelAdapter, type WhatsAppCompatibilityPort } from "../../lib/channels/whatsapp-adapter";
import { shadowWhatsAppInbound } from "../../lib/services/channel-shadow-service";
import { featureFlags } from "../../lib/feature-flags";

function compatibilityPort() {
  const calls: Array<{ type: "text" | "template"; input: SendMessageInput | SendStructuredMessageInput }> = [];
  const accepted: ChannelSendResult = { accepted: true, deliveryState: "QUEUED", externalMessageId: "wamid.test" };
  const port: WhatsAppCompatibilityPort = {
    async sendText(input) {
      calls.push({ type: "text", input });
      return accepted;
    },
    async sendTemplate(input) {
      calls.push({ type: "template", input });
      return accepted;
    }
  };
  return { calls, port };
}

function connection(workspaceId = "workspace-a") {
  return { id: "connection-1", workspaceId, kind: "WHATSAPP" as const, enabled: true };
}

test("WhatsApp adapter normalizes inbound messages into the common contract", async () => {
  const { port } = compatibilityPort();
  const adapter = new WhatsAppChannelAdapter(port);
  const messages = await adapter.receiveInboundEvent({
    workspaceId: "workspace-a",
    connectionId: "connection-1",
    externalEventId: "event-1",
    receivedAt: new Date("2026-08-29T10:00:00Z"),
    payload: {
      messages: [{
        id: "wamid.1",
        from: "919900001111",
        body: "I need an appointment tomorrow",
        type: "text",
        timestamp: "2026-08-29T10:00:00Z",
        profileName: "Test Customer"
      }]
    }
  });
  assert.equal(messages.length, 1);
  assert.equal(messages[0].channel, "WHATSAPP");
  assert.equal(messages[0].participant.externalKey, "919900001111");
  assert.equal(messages[0].message.idempotencyKey, "WHATSAPP:wamid.1");
  assert.equal(messages[0].message.body, "I need an appointment tomorrow");
});

test("channel router rejects a connection owned by another workspace", async () => {
  const { calls, port } = compatibilityPort();
  const registry = new ChannelRegistry().register(new WhatsAppChannelAdapter(port));
  const router = new ChannelRouter(registry);
  await assert.rejects(() => router.sendMessage({
    workspaceId: "workspace-b",
    connection: connection("workspace-a"),
    participantExternalKey: "919900001111",
    body: "Hello",
    idempotencyKey: "message-1"
  }), /Cross-workspace/);
  assert.equal(calls.length, 0);
});

test("channel router delegates an approved template without changing compatibility input", async () => {
  const { calls, port } = compatibilityPort();
  const registry = new ChannelRegistry().register(new WhatsAppChannelAdapter(port));
  const router = new ChannelRouter(registry);
  const result = await router.sendStructuredMessage({
    workspaceId: "workspace-a",
    connection: connection(),
    participantExternalKey: "919900001111",
    body: "Appointment confirmed",
    idempotencyKey: "appointment-confirmation-1",
    template: "appointment_confirmed",
    locale: "en_US",
    variables: ["Manish", "30 August"]
  });
  assert.equal(result.accepted, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].type, "template");
  assert.equal((calls[0].input as SendStructuredMessageInput).template, "appointment_confirmed");
});

test("adapter requires an idempotency key for every outbound operation", async () => {
  const { calls, port } = compatibilityPort();
  const router = new ChannelRouter(new ChannelRegistry().register(new WhatsAppChannelAdapter(port)));
  const result = await router.sendMessage({
    workspaceId: "workspace-a",
    connection: connection(),
    participantExternalKey: "919900001111",
    body: "Hello",
    idempotencyKey: ""
  });
  assert.equal(result.accepted, false);
  assert.equal(result.errorCode, "POLICY_REJECTED");
  assert.equal(calls.length, 0);
});

test("registry refuses duplicate adapter registration", () => {
  const first = compatibilityPort();
  const second = compatibilityPort();
  const registry = new ChannelRegistry().register(new WhatsAppChannelAdapter(first.port));
  assert.throws(() => registry.register(new WhatsAppChannelAdapter(second.port)), /already registered/);
});

test("disabled shadow mode leaves the legacy path untouched", async () => {
  let writes = 0;
  const result = await shadowWhatsAppInbound({
    propertySlug: "workspace-a",
    legacyLeadId: "lead-1",
    participantExternalKey: "+919900001111",
    body: "Hello",
    externalMessageId: "wamid.1",
    occurredAt: new Date("2026-08-29T10:00:00Z")
  }, {
    enabled: false,
    write: async () => { writes += 1; }
  });
  assert.deepEqual(result, { attempted: false, mirrored: false });
  assert.equal(writes, 0);
});

test("shadow failure is contained after the authoritative legacy write", async () => {
  const originalError = console.error;
  console.error = () => undefined;
  try {
    const result = await shadowWhatsAppInbound({
      propertySlug: "workspace-a",
      legacyLeadId: "lead-1",
      participantExternalKey: "+919900001111",
      body: "Hello",
      externalMessageId: "wamid.1",
      occurredAt: new Date("2026-08-29T10:00:00Z")
    }, {
      enabled: true,
      write: async () => { throw new Error("neutral database unavailable"); }
    });
    assert.deepEqual(result, { attempted: true, mirrored: false });
  } finally {
    console.error = originalError;
  }
});

test("duplicate inbound provider messages retain the same idempotency key", async () => {
  const adapter = new WhatsAppChannelAdapter(compatibilityPort().port);
  const event = {
    workspaceId: "workspace-a",
    connectionId: "connection-1",
    externalEventId: "event-1",
    receivedAt: new Date("2026-08-29T10:00:00Z"),
    payload: { messages: [{ id: "wamid.same", from: "919900001111", body: "Hello", timestamp: "2026-08-29T10:00:00Z" }] }
  };
  const first = await adapter.receiveInboundEvent(event);
  const replay = await adapter.receiveInboundEvent(event);
  assert.equal(first[0].message.idempotencyKey, replay[0].message.idempotencyKey);
  assert.equal(first[0].message.occurredAt.toISOString(), replay[0].message.occurredAt.toISOString());
});

test("shadow activation requires both flags and an explicit workspace allowlist", () => {
  const previous = {
    core: process.env.AIFROGI_CHANNEL_CORE_ENABLED,
    shadow: process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED,
    workspaces: process.env.AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS
  };
  try {
    process.env.AIFROGI_CHANNEL_CORE_ENABLED = "true";
    process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED = "true";
    process.env.AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS = "pilot-clinic, wellness-centre";
    assert.equal(featureFlags.channelShadowWriteForWorkspace("pilot-clinic"), true);
    assert.equal(featureFlags.channelShadowWriteForWorkspace("another-client"), false);
  } finally {
    if (previous.core === undefined) delete process.env.AIFROGI_CHANNEL_CORE_ENABLED;
    else process.env.AIFROGI_CHANNEL_CORE_ENABLED = previous.core;
    if (previous.shadow === undefined) delete process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED;
    else process.env.AIFROGI_CHANNEL_SHADOW_WRITE_ENABLED = previous.shadow;
    if (previous.workspaces === undefined) delete process.env.AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS;
    else process.env.AIFROGI_CHANNEL_SHADOW_WORKSPACE_SLUGS = previous.workspaces;
  }
});
