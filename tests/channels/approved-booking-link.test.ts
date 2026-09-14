import test from "node:test";
import assert from "node:assert/strict";
import { approvedBookingLink, normalizeWidgetMenu } from "../../lib/widget-menu";

test("finds only a tenant-approved booking link", () => {
  assert.equal(approvedBookingLink({ enabled: true, heading: "Explore", items: [
    { id: "stays", label: "Our stays", action: "LINK", value: "https://example.com/stays", icon: "link" },
    { id: "book", label: "Book online", action: "BOOKING", value: "https://example.com/booking", icon: "link", featured: true }
  ] })?.value, "https://example.com/booking");
  assert.equal(approvedBookingLink({ enabled: false, heading: "Explore", items: [] }), null);
});

test("preserves approved destination and stay choices for a booking card", () => {
  const menu = normalizeWidgetMenu({ enabled: true, heading: "Book", items: [{
    id: "book", label: "Book online", action: "BOOKING", value: "https://example.com/", icon: "link",
    children: [{ id: "stay-10", label: "Jodhpur|Rohet House", action: "LINK", value: "https://example.com/properties/10", icon: "link" }]
  }] }, { enabled: false, heading: "Explore", items: [] });
  assert.equal(menu.items[0].children?.[0].label, "Jodhpur|Rohet House");
  assert.equal(menu.items[0].children?.[0].value, "https://example.com/properties/10");
});
