import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

test("deferred messaging ingress is absent from the main application", () => {
  const proxySource = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  assert.doesNotMatch(proxySource, /"\/api\/integrations\/whatsapp\/inbound"/);
  assert.equal(existsSync(resolve(process.cwd(), "app/api/integrations/whatsapp/inbound/route.ts")), false);
});
