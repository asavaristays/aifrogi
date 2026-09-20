#!/usr/bin/env node
/**
 * Until AI Readiness moves to its own deployment and database, it is a
 * quarantined internal foundation. This gate prevents the live bot product
 * from acquiring an accidental runtime dependency on it.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const quarantineRoot = join(root, "lib", "ai-readiness");
const runtimeRoots = [join(root, "app"), join(root, "components"), join(root, "lib")];
const readinessModelPattern = /\b(readinessScan|readinessEvidence|readinessIssue|readinessWorkItem|readinessVerification)\b/;
const readinessImportPattern = /(?:from\s*["'][^"']*ai-readiness|require\(\s*["'][^"']*ai-readiness)/;
const prohibitedIntegrationPattern = /\b(BotConnector|Razorpay|paymentOrder|createBooking|createQuote|checkTenantStayAvailability|secretEncrypted)\b/i;
const violations = [];

function files(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return files(path);
    return /\.(?:ts|tsx|js|mjs)$/.test(entry.name) ? [path] : [];
  });
}

for (const directory of runtimeRoots) {
  for (const file of files(directory)) {
    if (file === quarantineRoot || file.startsWith(`${quarantineRoot}/`)) continue;
    const source = readFileSync(file, "utf8");
    if (readinessImportPattern.test(source) || readinessModelPattern.test(source)) {
      violations.push(`${relative(root, file)} creates a live bot dependency on quarantined AI Readiness.`);
    }
  }
}

for (const file of files(quarantineRoot)) {
  const source = readFileSync(file, "utf8");
  if (prohibitedIntegrationPattern.test(source)) {
    violations.push(`${relative(root, file)} reaches a bot connector, payment, booking, or credential path.`);
  }
}

const releaseGate = readFileSync(join(root, "ops", "verify-release-gates.mjs"), "utf8");
if (!releaseGate.includes("verify-ai-readiness-quarantine.mjs")) {
  violations.push("Release gate does not enforce the AI Readiness quarantine.");
}

if (violations.length) {
  throw new Error(`AI Readiness quarantine gate failed:\n- ${violations.join("\n- ")}`);
}

console.log("AI Readiness quarantine gate passed: no bot runtime dependency or connector/payment access exists.");
