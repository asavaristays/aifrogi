import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { generateKeyPairSync } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

const repository = process.cwd();

test("release-source verifier accepts the trusted signature and rejects mutation", () => {
  const directory = mkdtempSync(join(tmpdir(), "aifrogi-release-source-"));
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const privatePath = join(directory, "private.pem");
  const trustPath = join(directory, "trust.json");
  const manifestPath = join(directory, "manifest.json");
  const signedPath = join(directory, "signed.json");
  writeFileSync(privatePath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  writeFileSync(trustPath, JSON.stringify({ test: publicKey.export({ type: "spki", format: "pem" }) }));
  writeFileSync(manifestPath, JSON.stringify({ releaseId: "test-release", files: [{ path: "app.js", sha256: "a".repeat(64) }] }));

  execFileSync("node", ["ops/sign-release-source.mjs", manifestPath, signedPath], {
    cwd: repository,
    env: { ...process.env, AIFROGI_RELEASE_SOURCE_PRIVATE_KEY_FILE: privatePath, AIFROGI_RELEASE_SOURCE_KEY_ID: "test" },
  });
  const valid = execFileSync("node", ["ops/verify-signed-release-source.mjs", signedPath, trustPath], { cwd: repository, encoding: "utf8" });
  assert.match(valid, /RELEASE_SOURCE_SIGNATURE_PASS/);

  const signed = JSON.parse(readFileSync(signedPath, "utf8"));
  signed.manifest.releaseId = "mutated-release";
  writeFileSync(signedPath, JSON.stringify(signed));
  const rejected = spawnSync("node", ["ops/verify-signed-release-source.mjs", signedPath, trustPath], { cwd: repository, encoding: "utf8" });
  assert.notEqual(rejected.status, 0);
  assert.match(`${rejected.stdout}${rejected.stderr}`, /RELEASE_SOURCE_MANIFEST_MUTATED/);
});

test("staging load gate refuses fewer than 1,000 unique bot slugs", () => {
  const directory = mkdtempSync(join(tmpdir(), "aifrogi-staging-load-"));
  const inventoryPath = join(directory, "bots.txt");
  writeFileSync(inventoryPath, Array.from({ length: 999 }, (_, index) => `bot-${index + 1}`).join("\n"));
  const result = spawnSync("node", ["scripts/verify-staging-1000-bot-http.mjs"], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, AIFROGI_STAGING_BASE_URL: "https://staging.invalid", AIFROGI_STAGING_BOT_INVENTORY: inventoryPath, AIFROGI_STAGING_LOAD_REPORT: join(directory, "report.json") },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /STAGING_1000_UNIQUE_BOTS_REQUIRED/);
});

test("staging load gate refuses a shortened or excessive-concurrency profile", () => {
  const directory = mkdtempSync(join(tmpdir(), "aifrogi-staging-profile-"));
  const inventoryPath = join(directory, "bots.txt");
  writeFileSync(inventoryPath, Array.from({ length: 1000 }, (_, index) => `bot-${index + 1}`).join("\n"));
  const result = spawnSync("node", ["scripts/verify-staging-1000-bot-http.mjs"], {
    cwd: repository,
    encoding: "utf8",
    env: { ...process.env, AIFROGI_STAGING_BASE_URL: "https://staging.invalid", AIFROGI_STAGING_BOT_INVENTORY: inventoryPath, AIFROGI_STAGING_LOAD_REPORT: join(directory, "report.json"), AIFROGI_STAGING_LOAD_SECONDS: "299", AIFROGI_STAGING_LOAD_CONCURRENCY: "251" },
  });
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}${result.stderr}`, /STAGING_LOAD_PROFILE_INVALID/);
});

test("staging load gate sends the real route contract and requires full fleet coverage", () => {
  const source = readFileSync(join(repository, "scripts/verify-staging-1000-bot-http.mjs"), "utf8");
  assert.match(source, /JSON\.stringify\(\{message:/);
  assert.doesNotMatch(source, /JSON\.stringify\(\{question:/);
  assert.match(source, /uniqueBotsExercised/);
  assert.match(source, /exercised\.size===new Set\(bots\)\.size/);
});
