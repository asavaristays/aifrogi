import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("root-operated backups use a local administrator for forced-RLS completeness", () => {
  const source = readFileSync(resolve(process.cwd(), "ops/backup-postgres.sh"), "utf8");
  assert.match(source, /id postgres/);
  assert.match(source, /sudo -u postgres pg_dump/);
  assert.match(source, /--no-owner --no-privileges/);
  assert.match(source, /openssl enc -aes-256-cbc -pbkdf2/);
});
