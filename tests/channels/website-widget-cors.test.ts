import assert from "node:assert/strict";
import test from "node:test";

import { normalizeWebsiteOrigin, websiteWidgetCorsHeaders } from "../../lib/website-widget-cors";

test("normalizes a registered website to its browser origin", () => {
  assert.equal(normalizeWebsiteOrigin("webtechnosys.com/contact"), "https://webtechnosys.com");
  assert.equal(normalizeWebsiteOrigin("https://webtechnosys.com/about"), "https://webtechnosys.com");
});

test("allows only the exact registered website origin", () => {
  assert.deepEqual(websiteWidgetCorsHeaders("https://webtechnosys.com", "https://webtechnosys.com/about"), {
    "Access-Control-Allow-Origin": "https://webtechnosys.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    Vary: "Origin"
  });
  assert.equal(websiteWidgetCorsHeaders("https://hostile.example", "https://webtechnosys.com"), null);
  assert.equal(websiteWidgetCorsHeaders("https://www.webtechnosys.com", "https://webtechnosys.com"), null);
});

test("rejects malformed and non-web origins", () => {
  assert.equal(websiteWidgetCorsHeaders("null", "https://webtechnosys.com"), null);
  assert.equal(websiteWidgetCorsHeaders("file:///tmp/widget.html", "https://webtechnosys.com"), null);
  assert.equal(websiteWidgetCorsHeaders("https://webtechnosys.com", null), null);
});
