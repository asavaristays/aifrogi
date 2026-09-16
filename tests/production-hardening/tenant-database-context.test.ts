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
