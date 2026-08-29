import assert from "node:assert/strict";
import test from "node:test";
import { issueWebsiteVisitorToken, verifyWebsiteVisitorToken } from "../../lib/website-visitor-session";

test("website visitor tokens are tenant-bound and tamper evident", () => {
  process.env.WEBSITE_VISITOR_SESSION_SECRET = "test-secret-with-sufficient-entropy";
  const token = issueWebsiteVisitorToken({ slug: "webtechnosys", sessionId: "session-1", leadId: "lead-1", humanRequested: true });
  assert.equal(verifyWebsiteVisitorToken(token, "webtechnosys")?.leadId, "lead-1");
  assert.equal(verifyWebsiteVisitorToken(token, "hotelradar"), null);
  assert.equal(verifyWebsiteVisitorToken(`${token}x`, "webtechnosys"), null);
});
