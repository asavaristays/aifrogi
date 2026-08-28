import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("WhatsApp machine ingress reaches its dedicated route-level bearer authentication", () => {
  const proxySource = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
  const routeSource = readFileSync(
    resolve(process.cwd(), "app/api/integrations/whatsapp/inbound/route.ts"),
    "utf8"
  );

  assert.match(proxySource, /"\/api\/integrations\/whatsapp\/inbound"/);
  assert.match(routeSource, /authorization/);
  assert.match(routeSource, /Bearer /);
  assert.match(routeSource, /invalid inbound authorization/);
});
