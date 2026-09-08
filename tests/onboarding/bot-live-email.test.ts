import test from "node:test";
import assert from "node:assert/strict";
import { botLiveEmail } from "../../lib/bot-live-email-template";
test("live mail matches approved brand and retains text fallback", () => {
  const email = botLiveEmail({ ownerName: "Owner", businessName: "Business", slug: "business" });
  for (const value of ["aifrogi-logo-white.png", "#404040", "Open My AI Bot", "info@aifrogi.com", "+91-7410582898"]) assert.ok(email.html.includes(value));
  assert.ok(email.body.includes("https://app.aifrogi.com/bot/business"));
});
test("client supplied names cannot inject email HTML", () => {
  const email = botLiveEmail({ ownerName: "<img src=x>", businessName: "A&B", slug: "a/b" });
  assert.ok(email.html.includes("&lt;img src=x&gt;"));
  assert.ok(email.html.includes("A&amp;B"));
  assert.ok(email.html.includes("a%2Fb"));
});
