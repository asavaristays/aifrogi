import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const isolatedHttpSuites = [
  "tests/sovereign-intelligence/bucket-one-http.test.ts",
  "tests/sovereign-intelligence/bucket-three-b1-http.test.ts",
  "tests/sovereign-intelligence/bucket-three-b2-http.test.ts"
];

function testFiles(directory) {
  return readdirSync(directory)
    .filter((name) => name.endsWith(".test.ts") || name.endsWith(".test.mjs"))
    .map((name) => `${directory}/${name}`)
    .sort();
}

const sharedFixtureFiles = new Set(isolatedHttpSuites);
const regularSuites = [
  ...testFiles("tests/channels"),
  ...testFiles("tests/sovereign-intelligence").filter((file) => !sharedFixtureFiles.has(file)),
  ...testFiles("tests/admin"),
  ...testFiles("tests/onboarding"),
  ...testFiles("tests/ai-operations"),
  "tests/onboarding-workbook.test.ts"
];

for (const files of [regularSuites, ...isolatedHttpSuites.map((file) => [file])]) {
  const run = spawnSync(process.execPath, ["--import", "tsx", "--test", ...files], { stdio: "inherit" });
  if (run.status !== 0) process.exit(run.status || 1);
}
