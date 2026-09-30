import { accessSync, constants, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const requiredFiles = [
  ["AIFROGI_RELEASE_SOURCE_PRIVATE_KEY_FILE", "release signing private key"],
  ["AIFROGI_RELEASE_TRUST_FILE", "release signer trust file"],
  ["AIFROGI_STAGING_BOT_INVENTORY", "staging bot inventory"],
];
const failures = [];

for (const [name, description] of requiredFiles) {
  const value = process.env[name];
  if (!value) {
    failures.push(`${name}: missing (${description})`);
    continue;
  }
  try {
    accessSync(value, constants.R_OK);
  } catch {
    failures.push(`${name}: not readable (${value})`);
  }
}

for (const [name, description] of [
  ["AIFROGI_RELEASE_SOURCE_KEY_ID", "approved signer key ID"],
  ["AIFROGI_RELEASE_ID", "candidate release ID"],
  ["AIFROGI_STAGING_BASE_URL", "staging application origin"],
  ["AIFROGI_STAGING_LOAD_REPORT", "private load report destination"],
]) {
  if (!process.env[name]) failures.push(`${name}: missing (${description})`);
}

const baseUrl = process.env.AIFROGI_STAGING_BASE_URL;
if (baseUrl) {
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:") failures.push("AIFROGI_STAGING_BASE_URL: HTTPS required");
    if (parsed.username || parsed.password) failures.push("AIFROGI_STAGING_BASE_URL: credentials must not be embedded");
  } catch {
    failures.push("AIFROGI_STAGING_BASE_URL: invalid URL");
  }
}

const inventoryPath = process.env.AIFROGI_STAGING_BOT_INVENTORY;
if (inventoryPath) {
  try {
    const slugs = readFileSync(inventoryPath, "utf8").split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    const unique = new Set(slugs);
    if (unique.size < 1000) failures.push(`AIFROGI_STAGING_BOT_INVENTORY: ${unique.size}/1000 unique bot slugs`);
    if ([...unique].some((slug) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))) {
      failures.push("AIFROGI_STAGING_BOT_INVENTORY: invalid bot slug present");
    }
  } catch {
    // Readability failure is already reported above.
  }
}

try {
  const status = execFileSync("git", ["status", "--porcelain", "--untracked-files=all"], { encoding: "utf8" });
  if (status.trim()) failures.push("repository: working tree is not a clean reviewed release snapshot");
} catch {
  failures.push("repository: unable to inspect Git status");
}

if (failures.length) {
  console.error("FINAL_THREE_NOT_READY");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("FINAL_THREE_INPUTS_READY");
