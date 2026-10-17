import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("backups require an explicit verified administrative database target", () => {
  const source = readFileSync(resolve(process.cwd(), "ops/backup-postgres.sh"), "utf8");
  for (const key of ["AIFROGI_BACKUP_DATABASE_URL", "AIFROGI_BACKUP_EXPECTED_DATABASE", "AIFROGI_BACKUP_EXPECTED_SERVER_ADDR", "AIFROGI_BACKUP_EXPECTED_ROLE"]) assert.ok(source.includes(key));
  assert.match(source, /Refusing backup: connected database identity mismatch/);
  assert.match(source, /Refusing backup: connected server address mismatch/);
  assert.match(source, /Refusing backup: connected role mismatch/);
  assert.doesNotMatch(source, /sudo -u postgres/);
  assert.match(source, /--no-owner --no-privileges/);
  assert.match(source, /openssl enc -aes-256-cbc -pbkdf2/);
});
