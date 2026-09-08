import assert from "node:assert/strict";
import test from "node:test";
import { defaultWidgetMenu, normalizeWidgetMenu } from "../../lib/widget-menu";

test("new tenants start without a menu while Webtechnosys keeps its existing choices", () => {
  assert.equal(defaultWidgetMenu("new-client").enabled, false);
  const menu = defaultWidgetMenu("webtechnosys-ai-agency-e5da22");
  assert.equal(menu.enabled, true);
  assert.deepEqual(menu.items.map(item => item.label), ["Our AI Services", "AI Training & Booking", "AI Film Making", "Explore AI Bot Demos", "Contact Our Team"]);
});

test("menu validation allows safe actions and one submenu level", () => {
  const menu = normalizeWidgetMenu({ enabled: true, heading: "Choose", items: [{ id: "contact", label: "Contact", action: "SUBMENU", icon: "phone", children: [{ id: "call", label: "Call us", action: "CALL", value: "+91 74105 82898", icon: "phone" }] }] }, defaultWidgetMenu("client"));
  assert.equal(menu.items[0].children?.[0].value, "+917410582898");
  assert.throws(() => normalizeWidgetMenu({ enabled: true, heading: "Choose", items: [{ label: "Unsafe", action: "LINK", value: "javascript:alert(1)", icon: "link" }] }, defaultWidgetMenu("client")), /public HTTPS/);
  assert.throws(() => normalizeWidgetMenu({ enabled: true, heading: "Choose", items: [{ label: "Nested", action: "SUBMENU", icon: "link", children: [{ label: "Again", action: "SUBMENU", icon: "link" }] }] }, defaultWidgetMenu("client")), /submenu/);
});

test("menu limits main and submenu option counts", () => {
  const items = Array.from({ length: 9 }, (_, index) => ({ id: `item-${index}`, label: `Item ${index}`, action: "CHAT", icon: "chat" }));
  const menu = normalizeWidgetMenu({ enabled: true, heading: "Choose", items }, defaultWidgetMenu("client"));
  assert.equal(menu.items.length, 6);
});
