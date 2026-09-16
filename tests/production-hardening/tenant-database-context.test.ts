import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("tenant database context uses transaction-local identity", () => {
  const source = readFileSync(resolve(process.cwd(), "lib/security/tenant-database-context.ts"), "utf8");
  assert.match(source, /\$transaction/);
  assert.match(source, /set_config\('app\.organization_id'/);
  assert.match(source, /true\)`/);
  assert.doesNotMatch(source, /SET\s+SESSION/i);
});

test("RLS package forces policies on direct and indirect tenant tables", () => {
  const sql = readFileSync(resolve(process.cwd(), "ops/tenant-rls-policies.sql"), "utf8");
  assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  assert.match(sql, /WITH CHECK/);
  assert.match(sql, /BotConnectorCredential/);
  assert.match(sql, /ConversationParticipant/);
  assert.match(sql, /SupportTicketMessage/);
  assert.match(sql, /aifrogi_security\.has_platform_authority/);
  assert.match(sql, /SECURITY DEFINER/);
  assert.match(sql, /resolve_public_bot_organization/);
  assert.match(sql, /resolve_session_organization/);
  assert.match(sql, /REVOKE ALL ON FUNCTION aifrogi_security\.resolve_public_bot_organization/);
});

test("every public website data route establishes a tenant identity", () => {
  const routes = ["route.ts", "availability/route.ts", "feedback/route.ts", "flag/route.ts", "install/route.ts"];
  for (const route of routes) {
    const source = readFileSync(resolve(process.cwd(), "app/api/public/website-bot/[slug]", route), "utf8");
    assert.match(source, /withPublicBotDatabaseContext/, `${route} must establish database tenant identity`);
  }
});

test("identity-scoped database calls use short transaction-local contexts", () => {
  const source = readFileSync(resolve(process.cwd(), "lib/db.ts"), "utf8");
  assert.match(source, /identityScopedClient/);
  assert.match(source, /configureIdentity/);
  assert.match(source, /set_config\('app\.organization_id'/);
  assert.doesNotMatch(source, /SET\s+SESSION/i);
});

test("every directly tenant-keyed Prisma model appears in the RLS package", () => {
  const schema = readFileSync(resolve(process.cwd(), "prisma/schema.prisma"), "utf8");
  const sql = readFileSync(resolve(process.cwd(), "ops/tenant-rls-policies.sql"), "utf8");
  const blocks = [...schema.matchAll(/model\s+(\w+)\s*\{([\s\S]*?)\n\}/g)];
  const tenantModels = blocks
    .filter(([, , body]) => /^\s+(organizationId|propertyId|tenantId)\s+/m.test(body))
    .map(([, name]) => name);
  const missing = tenantModels.filter(name => !sql.includes(`'${name}'`) && !sql.includes(`\"${name}\"`));
  assert.deepEqual(missing, [], `RLS policy coverage missing for ${missing.join(", ")}`);
});
