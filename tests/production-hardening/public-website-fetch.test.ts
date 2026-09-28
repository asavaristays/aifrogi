import assert from "node:assert/strict";
import test from "node:test";
import { isPublicWebsiteAddress, publicWebsiteUrl, resolvePublicWebsite, fetchPublicWebsiteText } from "../../lib/security/public-website-fetch";

test("automatic website crawling denies private, metadata, mapped IPv6 and special networks", () => {
  for (const ip of ["127.0.0.1", "10.0.0.1", "0.0.0.0", "100.64.0.1", "169.254.169.254", "172.31.255.255", "192.168.1.1", "192.0.2.10", "198.18.0.1", "198.51.100.1", "203.0.113.1", "224.0.0.1", "255.255.255.255", "::1", "::", "::ffff:127.0.0.1", "::ffff:8.8.8.8", "fc00::1", "fe80::1", "2001:db8::1", "2002:7f00:1::", "not-an-ip"]) assert.equal(isPublicWebsiteAddress(ip), false, ip);
  for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "2001:4860:4860::8888"]) assert.equal(isPublicWebsiteAddress(ip), true, ip);
});
test("URLs reject credentials, non-web schemes, custom ports and cross-domain redirects", () => {
  for (const url of ["file:///etc/passwd", "ftp://example.com", "https://user:secret@example.com", "https://example.com:3011"]) assert.throws(() => publicWebsiteUrl(url));
  assert.throws(() => publicWebsiteUrl("http://169.254.169.254", new URL("https://hotel.example")));
  assert.equal(publicWebsiteUrl("https://www.hotel.example/stay", new URL("http://hotel.example")).hostname, "www.hotel.example");
});
test("DNS rejects mixed public/private answers and validates literal hosts before requests", async () => {
  const mixed = (async () => [{ address: "1.1.1.1", family: 4 }, { address: "127.0.0.1", family: 4 }]) as Parameters<typeof resolvePublicWebsite>[1];
  await assert.rejects(resolvePublicWebsite(new URL("https://hotel.example"), mixed), /public internet/);
  await assert.rejects(fetchPublicWebsiteText("http://2130706433/"), /public internet/);
  await assert.rejects(fetchPublicWebsiteText("http://[::ffff:127.0.0.1]/"), /public internet/);
});
