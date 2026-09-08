import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

// Closed manifest: missing, duplicated, skipped or failing cases withhold acceptance.
const required = ["B1-01", ...["PAUSED", "EXPIRED", "CONFLICT", "FLAGGED"].map(s => `B1-02-${s}`), ...Array.from({ length: 16 }, (_, i) => `B1-${String(i + 3).padStart(2, "0")}`)];
const result = spawnSync(process.execPath, ["--import", "tsx", "--test", "--test-reporter=tap", "tests/sovereign-intelligence/bucket-one-http.test.ts"], { encoding: "utf8" });
const output = `${result.stdout || ""}\n${result.stderr || ""}`;
const cases = [...output.matchAll(/^(ok|not ok) \d+ - (B1-[\w-]+) (.+)$/gm)].map(m => ({ id: m[2], passed: m[1] === "ok", name: m[3] }));
const missing = required.filter(id => cases.filter(c => c.id === id).length !== 1);
const unexpected = cases.filter(c => !required.includes(c.id));
const accepted = result.status === 0 && cases.length === required.length && !missing.length && !unexpected.length && cases.every(c => c.passed) && !/^(?:not )?ok .+# (?:SKIP|TODO)\b/im.test(output);
const report = { createdAt: new Date().toISOString(), evidenceType: "SYNTHETIC_ISOLATED_HTTP_HANDLER", runtime: "Actual POST handler, knowledge service/repository, HMAC sessions, resolution and claim validation; in-memory database and model transport fixtures", required: required.length, executed: cases.length, passed: cases.filter(c => c.passed).length, missing, unexpected, accepted, cases };
const directory = path.resolve("output/acceptance");
mkdirSync(directory, { recursive: true });
writeFileSync(path.join(directory, "bucket-one-http.tap"), output);
writeFileSync(path.join(directory, "bucket-one-http.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report, null, 2));
process.exit(accepted ? 0 : 1);
