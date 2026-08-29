import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repository = readFileSync(resolve(process.cwd(), "lib/repositories/ai-operations-repository.ts"), "utf8");
const route = readFileSync(resolve(process.cwd(), "app/api/ai-operations/[leadId]/route.ts"), "utf8");
const inbox = readFileSync(resolve(process.cwd(), "app/(app)/whatsapp-bot/page.tsx"), "utf8");

test("AI operations are scoped by both property and lead", () => {
  assert.match(repository, /id: input\.leadId, propertyId: input\.propertyId/);
  assert.match(repository, /id: input\.operationId, leadId: input\.leadId, propertyId: input\.propertyId/);
  assert.match(route, /resolveClientWorkspaceAccess\(\{ requireManage: true \}\)/);
});

test("completed actions require a verified outcome and evidence", () => {
  assert.match(repository, /A verified outcome is required/);
  assert.match(repository, /Verification evidence is required/);
});

test("operations use controlled action, status, and outcome vocabularies", () => {
  assert.match(repository, /const KINDS = new Set/);
  assert.match(repository, /const STATUSES = new Set/);
  assert.match(repository, /const OUTCOMES = new Set/);
});

test("unified inbox does not filter out Website Bot conversations", () => {
  assert.doesNotMatch(inbox, /source\.toLowerCase\(\)\.includes\("whatsapp"\)/);
  assert.match(inbox, /Website and WhatsApp conversations/);
});
