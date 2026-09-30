import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("public factual route fails closed through the per-bot database control", () => {
  const route = readFileSync("app/api/public/website-bot/[slug]/route.ts", "utf8");
  assert.match(route, /assertBotFactualServingOpen\(property\.id\)/);
  assert.ok(route.indexOf("assertBotFactualServingOpen(property.id)") < route.indexOf("()=>deliverCanonicalAnswer"));
});

test("only the platform-admin action invokes the closure mutation boundary", () => {
  const admin = readFileSync("app/api/admin/customers/[id]/route.ts", "utf8");
  const migration = readFileSync("prisma/migrations/20260930006500_per_bot_factual_closure/migration.sql", "utf8");
  assert.match(admin, /CLOSE_FACTUAL_SERVING/);
  assert.match(admin, /REOPEN_FACTUAL_SERVING/);
  assert.match(admin, /withPlatformAdminDatabaseContext/);
  assert.match(migration, /BOT_CLOSURE_VERSION_CONFLICT/);
  assert.match(migration, /BotFactualServingControlEvent_append_only/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION aifrogi_security\.set_bot_factual_closure[^;]+ TO leados_app/);
  assert.doesNotMatch(migration, /set_bot_factual_closure[^;]+ TO [^;]*aifrogi_public/);
});
